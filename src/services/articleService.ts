import { supabase } from './supabase';
import type {
  Article,
  ArticleCategory,
  ArticleTag,
  ArticleQueryParams,
  ArticleFormData,
  ArticleRow,
  ArticleCategoryRow,
  ArticleTagRow,
  convertToArticle,
  convertToArticleCategory,
  convertToArticleTag,
} from '../types/article';

// =============================================
// ARTICLE CATEGORY OPERATIONS
// =============================================

export async function getCategories(): Promise<ArticleCategory[]> {
  const { data, error } = await supabase
    .from('article_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return (data || []).map((row: ArticleCategoryRow) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<ArticleCategory | null> {
  const { data, error } = await supabase
    .from('article_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching category:', error);
    throw error;
  }

  const row = data as ArticleCategoryRow;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCategory(data: { name: string; slug: string; description?: string }): Promise<string> {
  const { data: result, error } = await supabase
    .from('article_categories')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return result.id;
}

export async function updateCategory(id: string, data: Partial<{ name: string; slug: string; description: string; isActive: boolean }>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { error } = await supabase
    .from('article_categories')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// =============================================
// ARTICLE TAG OPERATIONS
// =============================================

export async function getTags(): Promise<ArticleTag[]> {
  const { data, error } = await supabase
    .from('article_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  return (data || []).map((row: ArticleTagRow) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }));
}

export async function createTag(data: { name: string; slug: string }): Promise<string> {
  const { data: result, error } = await supabase
    .from('article_tags')
    .insert({
      name: data.name,
      slug: data.slug,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    throw error;
  }

  return result.id;
}

export async function getOrCreateTag(name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Try to find existing tag
  const { data: existing } = await supabase
    .from('article_tags')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new tag
  return createTag({ name, slug });
}

// =============================================
// ARTICLE OPERATIONS
// =============================================

export async function getArticles(params: ArticleQueryParams = {}): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select(`
      *,
      category:article_categories(*),
      author:users(id, name, email)
    `);

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status);
  } else {
    // Default to published for public queries
    query = query.eq('status', 'published');
  }

  if (params.categorySlug) {
    query = query.eq('category.slug', params.categorySlug);
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`);
  }

  // Apply ordering
  const orderBy = params.orderBy || 'published_at';
  const orderDir = params.orderDir === 'asc' ? true : false;
  query = query.order(orderBy, { ascending: orderDir });

  // Apply pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }

  // Fetch tags for each article
  const articlesWithTags = await Promise.all(
    (data || []).map(async (article: ArticleRow & { category: ArticleCategoryRow | null; author: { id: string; name: string; email: string } | null }) => {
      const { data: tagRelations } = await supabase
        .from('article_tag_relations')
        .select('tag:article_tags(*)')
        .eq('article_id', article.id);

      const tags = (tagRelations || []).map((r: { tag: ArticleTagRow }) => ({
        id: r.tag.id,
        name: r.tag.name,
        slug: r.tag.slug,
        createdAt: r.tag.created_at,
      }));

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        featuredImageUrl: article.featured_image_url,
        featuredImageAlt: article.featured_image_alt,
        metaTitle: article.meta_title,
        metaDescription: article.meta_description,
        focusKeyword: article.focus_keyword,
        canonicalUrl: article.canonical_url,
        seoScore: article.seo_score,
        readabilityScore: article.readability_score,
        category: article.category ? {
          id: article.category.id,
          name: article.category.name,
          slug: article.category.slug,
          description: article.category.description,
          isActive: article.category.is_active,
          sortOrder: article.category.sort_order,
          createdAt: article.category.created_at,
          updatedAt: article.category.updated_at,
        } : null,
        categoryId: article.category_id,
        tags,
        status: article.status,
        publishedAt: article.published_at,
        author: article.author ? {
          id: article.author.id,
          name: article.author.name,
          email: article.author.email,
        } : null,
        authorId: article.author_id,
        viewCount: article.view_count,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
      } as Article;
    })
  );

  return articlesWithTags;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:article_categories(*),
      author:users(id, name, email)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching article:', error);
    throw error;
  }

  const article = data as ArticleRow & { category: ArticleCategoryRow | null; author: { id: string; name: string; email: string } | null };

  // Fetch tags
  const { data: tagRelations } = await supabase
    .from('article_tag_relations')
    .select('tag:article_tags(*)')
    .eq('article_id', article.id);

  const tags = (tagRelations || []).map((r: { tag: ArticleTagRow }) => ({
    id: r.tag.id,
    name: r.tag.name,
    slug: r.tag.slug,
    createdAt: r.tag.created_at,
  }));

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt,
    metaTitle: article.meta_title,
    metaDescription: article.meta_description,
    focusKeyword: article.focus_keyword,
    canonicalUrl: article.canonical_url,
    seoScore: article.seo_score,
    readabilityScore: article.readability_score,
    category: article.category ? {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
      isActive: article.category.is_active,
      sortOrder: article.category.sort_order,
      createdAt: article.category.created_at,
      updatedAt: article.category.updated_at,
    } : null,
    categoryId: article.category_id,
    tags,
    status: article.status,
    publishedAt: article.published_at,
    author: article.author ? {
      id: article.author.id,
      name: article.author.name,
      email: article.author.email,
    } : null,
    authorId: article.author_id,
    viewCount: article.view_count,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  };
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:article_categories(*),
      author:users(id, name, email)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching article:', error);
    throw error;
  }

  const article = data as ArticleRow & { category: ArticleCategoryRow | null; author: { id: string; name: string; email: string } | null };

  // Fetch tags
  const { data: tagRelations } = await supabase
    .from('article_tag_relations')
    .select('tag:article_tags(*)')
    .eq('article_id', article.id);

  const tags = (tagRelations || []).map((r: { tag: ArticleTagRow }) => ({
    id: r.tag.id,
    name: r.tag.name,
    slug: r.tag.slug,
    createdAt: r.tag.created_at,
  }));

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt,
    metaTitle: article.meta_title,
    metaDescription: article.meta_description,
    focusKeyword: article.focus_keyword,
    canonicalUrl: article.canonical_url,
    seoScore: article.seo_score,
    readabilityScore: article.readability_score,
    category: article.category ? {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
      isActive: article.category.is_active,
      sortOrder: article.category.sort_order,
      createdAt: article.category.created_at,
      updatedAt: article.category.updated_at,
    } : null,
    categoryId: article.category_id,
    tags,
    status: article.status,
    publishedAt: article.published_at,
    author: article.author ? {
      id: article.author.id,
      name: article.author.name,
      email: article.author.email,
    } : null,
    authorId: article.author_id,
    viewCount: article.view_count,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  };
}

export async function createArticle(data: ArticleFormData, authorId: string): Promise<string> {
  const { data: result, error } = await supabase
    .from('articles')
    .insert({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      featured_image_url: data.featuredImageUrl || null,
      featured_image_alt: data.featuredImageAlt || null,
      meta_title: data.metaTitle || null,
      meta_description: data.metaDescription || null,
      focus_keyword: data.focusKeyword || null,
      canonical_url: data.canonicalUrl || null,
      category_id: data.categoryId || null,
      status: data.status,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
      author_id: authorId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating article:', error);
    throw error;
  }

  // Add tags
  if (data.tagIds && data.tagIds.length > 0) {
    const tagRelations = data.tagIds.map(tagId => ({
      article_id: result.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from('article_tag_relations')
      .insert(tagRelations);

    if (tagError) {
      console.error('Error adding tags:', tagError);
    }
  }

  return result.id;
}

export async function updateArticle(id: string, data: Partial<ArticleFormData>): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt || null;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.featuredImageUrl !== undefined) updateData.featured_image_url = data.featuredImageUrl || null;
  if (data.featuredImageAlt !== undefined) updateData.featured_image_alt = data.featuredImageAlt || null;
  if (data.metaTitle !== undefined) updateData.meta_title = data.metaTitle || null;
  if (data.metaDescription !== undefined) updateData.meta_description = data.metaDescription || null;
  if (data.focusKeyword !== undefined) updateData.focus_keyword = data.focusKeyword || null;
  if (data.canonicalUrl !== undefined) updateData.canonical_url = data.canonicalUrl || null;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId || null;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set published_at when publishing
    if (data.status === 'published') {
      // Check if already published
      const { data: existing } = await supabase
        .from('articles')
        .select('published_at')
        .eq('id', id)
        .single();

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
  }

  const { error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating article:', error);
    throw error;
  }

  // Update tags if provided
  if (data.tagIds !== undefined) {
    // Remove existing tags
    await supabase
      .from('article_tag_relations')
      .delete()
      .eq('article_id', id);

    // Add new tags
    if (data.tagIds.length > 0) {
      const tagRelations = data.tagIds.map(tagId => ({
        article_id: id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from('article_tag_relations')
        .insert(tagRelations);

      if (tagError) {
        console.error('Error updating tags:', tagError);
      }
    }
  }
}

export async function updateArticleSEOScores(id: string, seoScore: number, readabilityScore: number): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({
      seo_score: seoScore,
      readability_score: readabilityScore,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating SEO scores:', error);
    throw error;
  }
}

export async function deleteArticle(id: string): Promise<void> {
  // Soft delete by setting status to archived
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
}

export async function incrementArticleViewCount(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_article_view', { article_id: id });

  if (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw - view count is not critical
  }
}

export async function getRelatedArticles(articleId: string, categoryId: string | null, limit: number = 3): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select(`
      *,
      category:article_categories(*),
      author:users(id, name, email)
    `)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit);

  // Prefer same category
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }

  // If not enough from same category, get more from any category
  if (data.length < limit && categoryId) {
    const remaining = limit - data.length;
    const existingIds = data.map(a => a.id);
    existingIds.push(articleId);

    const { data: moreData } = await supabase
      .from('articles')
      .select(`
        *,
        category:article_categories(*),
        author:users(id, name, email)
      `)
      .eq('status', 'published')
      .not('id', 'in', `(${existingIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(remaining);

    if (moreData) {
      data.push(...moreData);
    }
  }

  return (data || []).map((article: ArticleRow & { category: ArticleCategoryRow | null; author: { id: string; name: string; email: string } | null }) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt,
    metaTitle: article.meta_title,
    metaDescription: article.meta_description,
    focusKeyword: article.focus_keyword,
    canonicalUrl: article.canonical_url,
    seoScore: article.seo_score,
    readabilityScore: article.readability_score,
    category: article.category ? {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
      isActive: article.category.is_active,
      sortOrder: article.category.sort_order,
      createdAt: article.category.created_at,
      updatedAt: article.category.updated_at,
    } : null,
    categoryId: article.category_id,
    tags: [],
    status: article.status,
    publishedAt: article.published_at,
    author: article.author ? {
      id: article.author.id,
      name: article.author.name,
      email: article.author.email,
    } : null,
    authorId: article.author_id,
    viewCount: article.view_count,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  }));
}

// =============================================
// ADMIN ARTICLE OPERATIONS
// =============================================

export async function getAdminArticles(params: ArticleQueryParams = {}): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select(`
      *,
      category:article_categories(*),
      author:users(id, name, email)
    `);

  // Apply filters (don't default to published for admin)
  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.categorySlug) {
    query = query.eq('category.slug', params.categorySlug);
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`);
  }

  // Apply ordering
  const orderBy = params.orderBy || 'created_at';
  const orderDir = params.orderDir === 'asc' ? true : false;
  query = query.order(orderBy, { ascending: orderDir });

  // Apply pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching admin articles:', error);
    throw error;
  }

  return (data || []).map((article: ArticleRow & { category: ArticleCategoryRow | null; author: { id: string; name: string; email: string } | null }) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt,
    metaTitle: article.meta_title,
    metaDescription: article.meta_description,
    focusKeyword: article.focus_keyword,
    canonicalUrl: article.canonical_url,
    seoScore: article.seo_score,
    readabilityScore: article.readability_score,
    category: article.category ? {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      description: article.category.description,
      isActive: article.category.is_active,
      sortOrder: article.category.sort_order,
      createdAt: article.category.created_at,
      updatedAt: article.category.updated_at,
    } : null,
    categoryId: article.category_id,
    tags: [],
    status: article.status,
    publishedAt: article.published_at,
    author: article.author ? {
      id: article.author.id,
      name: article.author.name,
      email: article.author.email,
    } : null,
    authorId: article.author_id,
    viewCount: article.view_count,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  }));
}

export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from('articles')
    .select('id')
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking slug:', error);
    throw error;
  }

  return !data || data.length === 0;
}
