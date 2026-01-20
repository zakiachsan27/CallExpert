import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types/article';
import { getRelatedArticles } from '../../services/articleService';
import { ArticleCard } from './ArticleCard';

interface RelatedArticlesProps {
  articleId: string;
  categoryId: string | null;
}

export function RelatedArticles({ articleId, categoryId }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const data = await getRelatedArticles(articleId, categoryId, 3);
        setArticles(data);
      } catch (error) {
        console.error('Error fetching related articles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelated();
  }, [articleId, categoryId]);

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Artikel Lainnya</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Artikel Lainnya</h2>
          <Link
            to="/artikel"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
