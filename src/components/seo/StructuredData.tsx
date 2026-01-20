import { Helmet } from 'react-helmet-async';
import type { Article } from '../../types/article';
import { estimateReadingTime } from '../../utils/readabilityAnalyzer';
import { countWords } from '../../utils/seoAnalyzer';

interface ArticleStructuredDataProps {
  article: Article;
  baseUrl?: string;
}

export function ArticleStructuredData({
  article,
  baseUrl = 'https://mentorinaja.com',
}: ArticleStructuredDataProps) {
  const url = `${baseUrl}/artikel/${article.slug}`;
  const wordCount = countWords(article.content);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.featuredImageUrl
      ? [article.featuredImageUrl]
      : [`${baseUrl}/og-image.png`],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: article.author?.name || 'MentorinAja',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MentorinAja',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    wordCount: wordCount,
    articleSection: article.category?.name,
    keywords: article.tags.map(t => t.name).join(', '),
  };

  // BreadcrumbList structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artikel',
        item: `${baseUrl}/artikel`,
      },
      ...(article.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: article.category.name,
              item: `${baseUrl}/artikel?category=${article.category.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: article.title,
              item: url,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: article.title,
              item: url,
            },
          ]),
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
    </Helmet>
  );
}

// For article list page
interface ArticleListStructuredDataProps {
  articles: Article[];
  baseUrl?: string;
}

export function ArticleListStructuredData({
  articles,
  baseUrl = 'https://mentorinaja.com',
}: ArticleListStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog MentorinAja',
    description: 'Artikel dan tips seputar karir, interview, CV, dan pengembangan diri',
    url: `${baseUrl}/artikel`,
    publisher: {
      '@type': 'Organization',
      name: 'MentorinAja',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    blogPost: articles.slice(0, 10).map(article => ({
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt,
      url: `${baseUrl}/artikel/${article.slug}`,
      datePublished: article.publishedAt,
      image: article.featuredImageUrl,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
