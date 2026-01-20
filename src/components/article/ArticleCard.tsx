import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye } from 'lucide-react';
import type { Article } from '../../types/article';
import { estimateReadingTime } from '../../utils/readabilityAnalyzer';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'featured';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const readingTime = estimateReadingTime(article.content);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (variant === 'horizontal') {
    return (
      <Link to={`/artikel/${article.slug}`} className="group">
        <article className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
          {article.featuredImageUrl && (
            <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={article.featuredImageUrl}
                alt={article.featuredImageAlt || article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {article.category && (
              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded mb-2">
                {article.category.name}
              </span>
            )}
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readingTime} menit
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/artikel/${article.slug}`} className="group">
        <article className="relative overflow-hidden rounded-2xl bg-gray-900 h-80">
          {article.featuredImageUrl && (
            <img
              src={article.featuredImageUrl}
              alt={article.featuredImageAlt || article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {article.category && (
              <span className="inline-block px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full mb-3">
                {article.category.name}
              </span>
            )}
            <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-gray-300 text-sm line-clamp-2 mb-3">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} menit baca
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewCount.toLocaleString()}
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/artikel/${article.slug}`} className="group">
      <article className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-purple-200 hover:shadow-lg transition-all">
        {article.featuredImageUrl ? (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img
              src={article.featuredImageUrl}
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
            <span className="text-purple-300 text-4xl font-bold">M</span>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                {article.category.name}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTime} menit
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.excerpt}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
