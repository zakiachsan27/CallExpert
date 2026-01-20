// SEO Analyzer for Articles
// Provides comprehensive SEO scoring based on best practices

import type { SEOAnalysis, SEOCheck } from '../types/article';

export interface ArticleSEOData {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  content: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  slug?: string;
}

// Helper: Strip HTML tags from content
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract headings from HTML content
export function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const regex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: stripHtml(match[2]),
    });
  }

  return headings;
}

// Helper: Extract images from HTML content
export function extractImages(html: string): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const regex = /<img[^>]*src=["']([^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    images.push({
      src: match[1] || '',
      alt: match[2] || '',
    });
  }

  // Also check for alt before src
  const regex2 = /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi;
  while ((match = regex2.exec(html)) !== null) {
    // Avoid duplicates
    if (!images.find(img => img.src === match[2])) {
      images.push({
        src: match[2] || '',
        alt: match[1] || '',
      });
    }
  }

  return images;
}

// Helper: Extract links from HTML content
export function extractLinks(html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push({
      href: match[1] || '',
      text: stripHtml(match[2]),
    });
  }

  return links;
}

// Helper: Check if link is internal
export function isInternalLink(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/')) return true;
  if (href.startsWith('#')) return true;
  if (href.includes('mentorinaja.com')) return true;
  if (href.includes('localhost')) return true;
  return false;
}

// Helper: Count words in text
export function countWords(text: string): number {
  const cleanText = stripHtml(text);
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

// Main SEO Analysis Function
export function analyzeSEO(data: ArticleSEOData): SEOAnalysis {
  const checks: SEOCheck[] = [];
  const content = data.content || '';
  const plainContent = stripHtml(content);
  const wordCount = countWords(content);

  // 1. Title Analysis (15 points)
  const titleToAnalyze = data.metaTitle || data.title;
  const titleLength = titleToAnalyze.length;
  let titlePoints = 0;
  let titleStatus: 'good' | 'warning' | 'error' = 'error';
  let titleMessage = '';

  if (titleLength >= 50 && titleLength <= 60) {
    titlePoints = 15;
    titleStatus = 'good';
    titleMessage = `${titleLength} karakter (optimal)`;
  } else if (titleLength >= 40 && titleLength <= 70) {
    titlePoints = 10;
    titleStatus = 'warning';
    titleMessage = `${titleLength} karakter (sebaiknya 50-60)`;
  } else if (titleLength > 0) {
    titlePoints = 5;
    titleStatus = 'error';
    titleMessage = `${titleLength} karakter (optimal: 50-60)`;
  } else {
    titleMessage = 'Judul belum diisi';
  }

  checks.push({
    id: 'title-length',
    name: 'Panjang Judul',
    status: titleStatus,
    message: titleMessage,
    points: titlePoints,
    maxPoints: 15,
  });

  // 2. Meta Description (15 points)
  const metaDescLength = data.metaDescription?.length || 0;
  let metaPoints = 0;
  let metaStatus: 'good' | 'warning' | 'error' = 'error';
  let metaMessage = '';

  if (metaDescLength >= 150 && metaDescLength <= 160) {
    metaPoints = 15;
    metaStatus = 'good';
    metaMessage = `${metaDescLength} karakter (optimal)`;
  } else if (metaDescLength >= 120 && metaDescLength <= 170) {
    metaPoints = 10;
    metaStatus = 'warning';
    metaMessage = `${metaDescLength} karakter (sebaiknya 150-160)`;
  } else if (metaDescLength > 0) {
    metaPoints = 5;
    metaStatus = 'error';
    metaMessage = `${metaDescLength} karakter (optimal: 150-160)`;
  } else {
    metaMessage = 'Meta deskripsi belum diisi';
  }

  checks.push({
    id: 'meta-description',
    name: 'Meta Deskripsi',
    status: metaStatus,
    message: metaMessage,
    points: metaPoints,
    maxPoints: 15,
  });

  // 3. Focus Keyword in Title (10 points)
  const keyword = data.focusKeyword?.toLowerCase().trim();
  const titleHasKeyword = keyword && titleToAnalyze.toLowerCase().includes(keyword);

  checks.push({
    id: 'keyword-title',
    name: 'Kata Kunci di Judul',
    status: titleHasKeyword ? 'good' : keyword ? 'error' : 'warning',
    message: titleHasKeyword
      ? 'Ditemukan di judul'
      : keyword
        ? 'Tidak ditemukan di judul'
        : 'Belum ada kata kunci fokus',
    points: titleHasKeyword ? 10 : 0,
    maxPoints: 10,
  });

  // 4. Focus Keyword in Meta Description (5 points)
  const metaHasKeyword = keyword && data.metaDescription?.toLowerCase().includes(keyword);

  checks.push({
    id: 'keyword-meta',
    name: 'Kata Kunci di Meta Deskripsi',
    status: metaHasKeyword ? 'good' : keyword ? 'warning' : 'warning',
    message: metaHasKeyword
      ? 'Ditemukan di meta deskripsi'
      : keyword
        ? 'Tidak ditemukan di meta deskripsi'
        : 'Belum ada kata kunci fokus',
    points: metaHasKeyword ? 5 : 0,
    maxPoints: 5,
  });

  // 5. Keyword Density (10 points)
  let keywordCount = 0;
  let density = 0;
  if (keyword && wordCount > 0) {
    const keywordRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = plainContent.match(keywordRegex);
    keywordCount = matches ? matches.length : 0;
    density = (keywordCount / wordCount) * 100;
  }

  let densityPoints = 0;
  let densityStatus: 'good' | 'warning' | 'error' = 'error';
  if (density >= 1 && density <= 3) {
    densityPoints = 10;
    densityStatus = 'good';
  } else if (density > 0 && density < 5) {
    densityPoints = 5;
    densityStatus = 'warning';
  }

  checks.push({
    id: 'keyword-density',
    name: 'Kepadatan Kata Kunci',
    status: keyword ? densityStatus : 'warning',
    message: keyword
      ? `${density.toFixed(1)}% (${keywordCount}x dalam ${wordCount} kata, optimal: 1-3%)`
      : 'Belum ada kata kunci fokus',
    points: densityPoints,
    maxPoints: 10,
  });

  // 6. Content Length (10 points)
  let contentPoints = 0;
  let contentStatus: 'good' | 'warning' | 'error' = 'error';

  if (wordCount >= 800) {
    contentPoints = 10;
    contentStatus = 'good';
  } else if (wordCount >= 300) {
    contentPoints = 5;
    contentStatus = 'warning';
  }

  checks.push({
    id: 'content-length',
    name: 'Panjang Konten',
    status: contentStatus,
    message: `${wordCount} kata (minimal rekomendasi: 800)`,
    points: contentPoints,
    maxPoints: 10,
  });

  // 7. Heading Structure (10 points)
  const headings = extractHeadings(content);
  const h1Count = headings.filter(h => h.level === 1).length;
  const h2Count = headings.filter(h => h.level === 2).length;

  // Note: H1 biasanya adalah title artikel, jadi kita check H2 saja
  let headingPoints = 0;
  let headingStatus: 'good' | 'warning' | 'error' = 'error';
  let headingMessage = '';

  if (h2Count >= 2) {
    headingPoints = 10;
    headingStatus = 'good';
    headingMessage = `${h2Count} sub-heading (H2) ditemukan`;
  } else if (h2Count === 1) {
    headingPoints = 5;
    headingStatus = 'warning';
    headingMessage = `Hanya 1 sub-heading (H2), tambahkan lebih banyak`;
  } else {
    headingMessage = 'Tidak ada sub-heading (H2), tambahkan untuk struktur lebih baik';
  }

  checks.push({
    id: 'heading-structure',
    name: 'Struktur Heading',
    status: headingStatus,
    message: headingMessage,
    points: headingPoints,
    maxPoints: 10,
  });

  // 8. Image Alt Text (10 points)
  const images = extractImages(content);
  const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0);
  const altRatio = images.length > 0 ? imagesWithAlt.length / images.length : 1;

  let imagePoints = 0;
  let imageStatus: 'good' | 'warning' | 'error' = 'warning';

  if (images.length === 0) {
    imagePoints = 5;
    imageStatus = 'warning';
  } else if (altRatio === 1) {
    imagePoints = 10;
    imageStatus = 'good';
  } else if (altRatio >= 0.5) {
    imagePoints = Math.round(altRatio * 10);
    imageStatus = 'warning';
  } else {
    imagePoints = Math.round(altRatio * 10);
    imageStatus = 'error';
  }

  checks.push({
    id: 'image-alt',
    name: 'Alt Text Gambar',
    status: imageStatus,
    message:
      images.length === 0
        ? 'Tidak ada gambar dalam konten'
        : `${imagesWithAlt.length}/${images.length} gambar memiliki alt text`,
    points: imagePoints,
    maxPoints: 10,
  });

  // 9. Featured Image (5 points)
  let featuredPoints = 0;
  let featuredStatus: 'good' | 'warning' | 'error' = 'error';
  let featuredMessage = '';

  if (data.featuredImageUrl) {
    if (data.featuredImageAlt && data.featuredImageAlt.trim().length > 0) {
      featuredPoints = 5;
      featuredStatus = 'good';
      featuredMessage = 'Ada dengan alt text';
    } else {
      featuredPoints = 3;
      featuredStatus = 'warning';
      featuredMessage = 'Ada, tapi tanpa alt text';
    }
  } else {
    featuredMessage = 'Belum ada gambar utama';
  }

  checks.push({
    id: 'featured-image',
    name: 'Gambar Utama',
    status: featuredStatus,
    message: featuredMessage,
    points: featuredPoints,
    maxPoints: 5,
  });

  // 10. Internal/External Links (10 points)
  const links = extractLinks(content);
  const internalLinks = links.filter(l => isInternalLink(l.href));
  const externalLinks = links.filter(l => !isInternalLink(l.href));

  let linkPoints = 0;
  let linkStatus: 'good' | 'warning' | 'error' = 'error';

  if (internalLinks.length >= 2 && externalLinks.length >= 1) {
    linkPoints = 10;
    linkStatus = 'good';
  } else if (internalLinks.length >= 1 || externalLinks.length >= 1) {
    linkPoints = Math.min(10, internalLinks.length * 3 + externalLinks.length * 2);
    linkStatus = 'warning';
  }

  checks.push({
    id: 'links',
    name: 'Internal & External Links',
    status: linkStatus,
    message: `${internalLinks.length} internal, ${externalLinks.length} external (rekomendasi: min 2 internal + 1 external)`,
    points: linkPoints,
    maxPoints: 10,
  });

  // Calculate total score
  const totalScore = checks.reduce((sum, check) => sum + check.points, 0);

  return {
    score: totalScore,
    checks,
  };
}

// Get SEO score color based on score
export function getSEOScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

// Get SEO score background color
export function getSEOScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

// Get SEO score label
export function getSEOScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}
