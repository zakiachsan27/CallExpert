import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArticleCard } from '../components/article/ArticleCard';
import { ArticleListStructuredData } from '../components/seo/StructuredData';
import { getArticles, getCategories } from '../services/articleService';
import type { Article, ArticleCategory } from '../types/article';

export function ArticleListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search');

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || '');
  const [visibleCount, setVisibleCount] = useState(9);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchData();
  }, [categoryFromUrl, searchFromUrl]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        getArticles({
          status: 'published',
          categorySlug: categoryFromUrl || undefined,
          search: searchFromUrl || undefined,
          orderBy: 'published_at',
          orderDir: 'desc',
        }),
        getCategories(),
      ]);

      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categorySlug) params.set('category', categorySlug);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSearchParams({});
  };

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;
  const featuredArticle = articles[0];
  const regularArticles = articles.slice(1, visibleCount);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>Artikel & Tips Karir | MentorinAja</title>
        <meta
          name="description"
          content="Baca artikel terbaru seputar tips karir, interview, CV, dan pengembangan diri dari MentorinAja"
        />
        <link rel="canonical" href="https://mentorinaja.com/artikel" />
      </Helmet>

      <ArticleListStructuredData articles={articles} />

      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 to-purple-800 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Artikel & Tips Karir
              </h1>
              <p className="text-purple-100 text-lg mb-8">
                Dapatkan insight, tips, dan panduan untuk mengembangkan karirmu
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Cari artikel..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-12 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-purple-300 text-gray-900 bg-white"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Cari
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Categories & Filters */}
        <section className="border-b border-gray-100 sticky top-16 bg-white z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 py-4 overflow-x-auto">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  !selectedCategory
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    selectedCategory === category.slug
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}

              {(searchFromUrl || categoryFromUrl) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada artikel ditemukan
                </h3>
                <p className="text-gray-500 mb-4">
                  Coba ubah filter atau kata kunci pencarian
                </p>
                <button
                  onClick={clearFilters}
                  className="text-purple-600 font-medium hover:text-purple-700"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <>
                {/* Featured Article (only on first page without search) */}
                {!searchFromUrl && !categoryFromUrl && featuredArticle && (
                  <div className="mb-10">
                    <ArticleCard article={featuredArticle} variant="featured" />
                  </div>
                )}

                {/* Regular Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(searchFromUrl || categoryFromUrl ? visibleArticles : regularArticles).map(
                    article => (
                      <ArticleCard key={article.id} article={article} />
                    )
                  )}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 9)}
                      className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition"
                    >
                      Muat Lebih Banyak
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
