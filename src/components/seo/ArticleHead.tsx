import { Helmet } from 'react-helmet-async';
import type { Article } from '../../types/article';

interface ArticleHeadProps {
  article: Article;
  baseUrl?: string;
}

export function ArticleHead({ article, baseUrl = 'https://mentorinaja.com' }: ArticleHeadProps) {
  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt || '';
  const url = `${baseUrl}/artikel/${article.slug}`;
  const image = article.featuredImageUrl || `${baseUrl}/og-image.png`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title} | MentorinAja</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={article.canonicalUrl || url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="MentorinAja" />
      <meta property="og:locale" content="id_ID" />

      {/* Article specific OG */}
      {article.publishedAt && (
        <meta property="article:published_time" content={article.publishedAt} />
      )}
      {article.updatedAt && (
        <meta property="article:modified_time" content={article.updatedAt} />
      )}
      {article.author?.name && (
        <meta property="article:author" content={article.author.name} />
      )}
      {article.category?.name && (
        <meta property="article:section" content={article.category.name} />
      )}
      {article.tags.map(tag => (
        <meta key={tag.id} property="article:tag" content={tag.name} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      {article.focusKeyword && (
        <meta name="keywords" content={article.focusKeyword} />
      )}
    </Helmet>
  );
}
