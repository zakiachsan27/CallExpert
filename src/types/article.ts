// Article Types for CallExpert

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  canonicalUrl: string | null;
  seoScore: number;
  readabilityScore: number;
  category: ArticleCategory | null;
  categoryId: string | null;
  tags: ArticleTag[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  author: ArticleAuthor | null;
  authorId: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleAuthor {
  id: string;
  name: string;
  email?: string;
}

// Form data for creating/updating articles
export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  categoryId: string;
  tagIds: string[];
  status: 'draft' | 'published' | 'archived';
}

// Query params for fetching articles
export interface ArticleQueryParams {
  status?: 'draft' | 'published' | 'archived';
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'published_at' | 'created_at' | 'view_count' | 'seo_score';
  orderDir?: 'asc' | 'desc';
}

// SEO Analysis Types
export interface SEOCheck {
  id: string;
  name: string;
  status: 'good' | 'warning' | 'error';
  message: string;
  points: number;
  maxPoints: number;
}

export interface SEOAnalysis {
  score: number; // 0-100
  checks: SEOCheck[];
}

export interface ReadabilityResult {
  score: number; // 0-100
  level: 'easy' | 'medium' | 'hard';
  averageSentenceLength: number;
  averageWordLength: number;
  wordCount: number;
  suggestions: string[];
}

// Database row types (snake_case)
export interface ArticleCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleTagRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  seo_score: number;
  readability_score: number;
  category_id: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  author_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// Converter functions
export function convertToArticleCategory(row: ArticleCategoryRow): ArticleCategory {
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

export function convertToArticleTag(row: ArticleTagRow): ArticleTag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

export function convertToArticle(
  row: ArticleRow,
  category: ArticleCategoryRow | null,
  tags: ArticleTagRow[],
  author: { id: string; name: string; email?: string } | null
): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    canonicalUrl: row.canonical_url,
    seoScore: row.seo_score,
    readabilityScore: row.readability_score,
    category: category ? convertToArticleCategory(category) : null,
    categoryId: row.category_id,
    tags: tags.map(convertToArticleTag),
    status: row.status,
    publishedAt: row.published_at,
    author: author,
    authorId: row.author_id,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
