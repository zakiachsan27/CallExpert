import { Calendar, Clock, Eye, User } from 'lucide-react';
import type { Article } from '../../types/article';
import { estimateReadingTime } from '../../utils/readabilityAnalyzer';

interface ArticleMetaProps {
  article: Article;
  variant?: 'default' | 'compact';
}

export function ArticleMeta({ article, variant = 'default' }: ArticleMetaProps) {
  const readingTime = estimateReadingTime(article.content);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(article.publishedAt)}
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {readingTime} menit baca
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {article.viewCount.toLocaleString()} views
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100">
      {article.author && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{article.author.name}</p>
            <p className="text-xs text-gray-500">Author</p>
          </div>
        </div>
      )}

      <div className="h-8 w-px bg-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2 text-gray-500">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">{formatDate(article.publishedAt)}</span>
      </div>

      <div className="h-8 w-px bg-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-sm">{readingTime} menit baca</span>
      </div>

      <div className="h-8 w-px bg-gray-200 hidden sm:block" />

      <div className="flex items-center gap-2 text-gray-500">
        <Eye className="w-4 h-4" />
        <span className="text-sm">{article.viewCount.toLocaleString()} views</span>
      </div>
    </div>
  );
}
