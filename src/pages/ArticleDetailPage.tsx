import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArticleHead } from '../components/seo/ArticleHead';
import { ArticleStructuredData } from '../components/seo/StructuredData';
import { ArticleMeta } from '../components/article/ArticleMeta';
import { ArticleShare } from '../components/article/ArticleShare';
import { TableOfContents, processContentWithIds } from '../components/article/TableOfContents';
import { RelatedArticles } from '../components/article/RelatedArticles';
import { getArticleBySlug, incrementArticleViewCount } from '../services/articleService';
import type { Article } from '../types/article';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug]);

  async function fetchArticle(articleSlug: string) {
    setIsLoading(true);
    setError('');

    try {
      const data = await getArticleBySlug(articleSlug);

      if (!data) {
        setError('Artikel tidak ditemukan');
        return;
      }

      if (data.status !== 'published') {
        setError('Artikel tidak tersedia');
        return;
      }

      setArticle(data);

      // Increment view count (fire and forget)
      incrementArticleViewCount(data.id);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Terjadi kesalahan saat memuat artikel');
    } finally {
      setIsLoading(false);
    }
  }

  const articleUrl = `https://mentorinaja.com/artikel/${slug}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Artikel tidak ditemukan'}
            </h1>
            <p className="text-gray-500 mb-6">
              Artikel yang Anda cari mungkin sudah dihapus atau tidak tersedia
            </p>
            <Link
              to="/artikel"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Artikel
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Process content to add heading IDs for TOC
  const processedContent = processContentWithIds(article.content);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ArticleHead article={article} />
      <ArticleStructuredData article={article} />

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav className="bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <ol className="flex items-center gap-2 py-3 text-sm overflow-x-auto">
              <li>
                <Link to="/" className="text-gray-500 hover:text-purple-600">
                  Home
                </Link>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <li>
                <Link to="/artikel" className="text-gray-500 hover:text-purple-600">
                  Artikel
                </Link>
              </li>
              {article.category && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <li>
                    <Link
                      to={`/artikel?category=${article.category.slug}`}
                      className="text-gray-500 hover:text-purple-600"
                    >
                      {article.category.name}
                    </Link>
                  </li>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <li className="text-gray-900 font-medium truncate max-w-xs">{article.title}</li>
            </ol>
          </div>
        </nav>

        {/* Featured Image */}
        {article.featuredImageUrl && (
          <div className="relative h-64 md:h-96 bg-gray-100">
            <img
              src={article.featuredImageUrl}
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Article Content */}
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto lg:max-w-none lg:grid lg:grid-cols-12 lg:gap-10">
            {/* Main Content */}
            <article className="lg:col-span-8">
              {/* Header */}
              <header className="mb-8">
                {article.category && (
                  <Link
                    to={`/artikel?category=${article.category.slug}`}
                    className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full mb-4 hover:bg-purple-200 transition"
                  >
                    {article.category.name}
                  </Link>
                )}

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>
                )}

                <ArticleMeta article={article} />
              </header>

              {/* Content */}
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Tags:</span>
                    {article.tags.map(tag => (
                      <Link
                        key={tag.id}
                        to={`/artikel?tag=${tag.slug}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-purple-100 hover:text-purple-700 transition"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <ArticleShare title={article.title} url={articleUrl} />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <TableOfContents content={article.content} />

                {/* Share Card */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Bagikan Artikel</h3>
                  <ArticleShare title={article.title} url={articleUrl} />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Related Articles */}
        <RelatedArticles articleId={article.id} categoryId={article.categoryId} />
      </main>

      <Footer />
    </div>
  );
}
