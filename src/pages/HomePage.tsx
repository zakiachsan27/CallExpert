import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Search, Star, MapPin, Briefcase, Check, MessageCircle, CalendarCheck, ChevronLeft, ChevronRight, ArrowRight, Clock, Calendar } from 'lucide-react';
import { getFeaturedExperts } from '../services/database';
import { getArticles } from '../services/articleService';
import type { Expert } from '../App';
import type { Article } from '../types/article';
import { estimateReadingTime } from '../utils/readabilityAnalyzer';

// Testimonial data
const testimonials = [
  {
    id: 1,
    quote: "Sesi dengan Kak Zaki bener-bener bantu gw paham cara prioritasi backlog di project AI. Stuck no more!",
    name: "Andi Pratama",
    role: "Associate PM",
    bgColor: "bg-brand-100"
  },
  {
    id: 2,
    quote: "Review portofolio UX bener-bener detail. Akhirnya gw pede buat apply ke unicorn.",
    name: "Siska Putri",
    role: "Junior Designer",
    bgColor: "bg-blue-100"
  },
  {
    id: 3,
    quote: "Insight soal kultur kerja di Tech Company sangat membuka mata buat gw yang baru mau lulus.",
    name: "Rian Hakim",
    role: "Student",
    bgColor: "bg-gray-100"
  },
  {
    id: 4,
    quote: "Simulasi Mock Interview System Design sangat real. Feedbacknya daging semua.",
    name: "Bayu Setiawan",
    role: "Software Eng",
    bgColor: "bg-green-100"
  },
  {
    id: 5,
    quote: "Dikasih strategi campaign marketing yang low budget tapi high impact.",
    name: "Dina Aulia",
    role: "Marketing Lead",
    bgColor: "bg-brand-100"
  },
  {
    id: 6,
    quote: "Belajar SQL buat analisis data transaksi jadi lebih mudah dipahami.",
    name: "Reza Pahlevi",
    role: "Data Analyst",
    bgColor: "bg-orange-100"
  },
  {
    id: 7,
    quote: "Konsultasi career switch dari Admin ke HR Tech berjalan mulus berkat roadmapnya.",
    name: "Clarissa",
    role: "HR Officer",
    bgColor: "bg-pink-100"
  },
  {
    id: 8,
    quote: "Tips negosiasi gaji dan kontrak kerja sangat membantu saya dapat offer terbaik.",
    name: "Tio Nugroho",
    role: "Sales Mgr",
    bgColor: "bg-teal-100"
  }
];

const MAX_RETRIES = 3;
const TIMEOUT_MS = 10000;

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialsPerPage = 4;
  const maxIndex = Math.ceil(testimonials.length / testimonialsPerPage) - 1;

  // Retry helper with exponential backoff
  async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Retry ${retries + 1}/${MAX_RETRIES}] Error:`, err);
      if (retries < MAX_RETRIES - 1) {
        const delay = 1000 * (retries + 1); // 1s, 2s, 3s
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(fn, retries + 1);
      }
      throw err;
    }
  }

  // Timeout wrapper
  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
      ),
    ]);
  }

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[HomePage] Loading featured experts and articles...');
      
      const [expertsData, articlesData] = await Promise.all([
        withTimeout(
          fetchWithRetry(() => getFeaturedExperts(4)),
          TIMEOUT_MS
        ),
        withTimeout(
          fetchWithRetry(() => getArticles({ status: 'published', limit: 3, orderBy: 'published_at', orderDir: 'desc' })),
          TIMEOUT_MS
        ),
      ]);
      
      console.log('[HomePage] Loaded experts:', expertsData.length);
      console.log('[HomePage] Loaded articles:', articlesData.length);
      
      setExperts(expertsData);
      setArticles(articlesData);
    } catch (err) {
      console.error('[HomePage] Failed to load data:', err);
      const message = err instanceof Error ? err.message : 'Gagal memuat data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/experts?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/experts');
    }
  };

  const handleExpertClick = (slugOrId: string) => {
    navigate(`/expert/${slugOrId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };

  const getLowestPrice = (expert: Expert) => {
    if (!expert.sessionTypes || expert.sessionTypes.length === 0) return null;
    return Math.min(...expert.sessionTypes.map(s => s.price));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header transparent />

      {/* Hero Section */}
      <div className="relative pt-16 pb-12 px-4 border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-white bg-grid-pattern pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white, transparent)' }} />
        <div className="relative max-w-3xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wide mb-4 border border-brand-100">
            Platform Mentoring #1 Indonesia
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 italic leading-tight">
            Selesaikan Isu Karirmu <br/>
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 text-gradient-fix">
              Lewat Mentoring.
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-6 max-w-xl mx-auto leading-relaxed">
            Dapatkan solusi nyata untuk masalah kerjamu dari para praktisi ahli yang sudah berpengalaman di bidangnya.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto shadow-xl shadow-brand-100 rounded-full group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 shadow-sm transition text-sm"
              placeholder="Cari mentor (Misal: Senior PM, UX Designer)..."
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition" />
            </div>
          </form>

          <div className="mt-5 flex justify-center items-center gap-4 text-xs text-gray-400 font-medium">
            <p className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              Dipercaya 5,000+ Profesional di Indonesia
            </p>
          </div>
        </div>
      </div>

      {/* Why MentorinAja Section */}
      <section className="py-10 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold italic text-slate-900">Why MentorinAja?</h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">Alasan mengapa ribuan profesional memilih bimbingan di sini.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-md shadow-gray-100 hover:shadow-lg hover:-translate-y-1 transition">
              <div className="w-10 h-10 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-2 italic text-slate-900">Expert Terverifikasi</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Semua expert melalui seleksi ketat untuk memastikan bimbingan berkualitas tinggi.</p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-md shadow-gray-100 hover:shadow-lg hover:-translate-y-1 transition">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-2 italic text-slate-900">Metode Interaksi Beragam</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Konsultasi fleksibel via real-time chat, video call, hingga undang expert ke event kantor.</p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-md shadow-gray-100 hover:shadow-lg hover:-translate-y-1 transition">
              <div className="w-10 h-10 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-2 italic text-slate-900">Jadwal Fleksibel</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Sinkronisasi kalender otomatis. Atur waktu sesi sesuai kenyamananmu tanpa ribet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testi" className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold italic">Bantu Selesaikan Isu Karirmu</h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">Dengarkan cerita sukses dari user kami.</p>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:hidden">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="min-w-[200px] max-w-[220px] p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-brand-200 transition snap-center flex-shrink-0"
              >
                <div className="flex text-yellow-400 mb-2 text-xs">
                  {'★'.repeat(5)}
                </div>
                <p className="text-gray-600 text-sm italic mb-3 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${testimonial.bgColor}`}></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Carousel */}
          <div className="hidden md:block relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => setTestimonialIndex(Math.max(0, testimonialIndex - 1))}
              disabled={testimonialIndex === 0}
              className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition ${
                testimonialIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-brand-300'
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setTestimonialIndex(Math.min(maxIndex, testimonialIndex + 1))}
              disabled={testimonialIndex === maxIndex}
              className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition ${
                testimonialIndex === maxIndex ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-brand-300'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Carousel Content */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
              >
                {/* Group testimonials in pages of 4 */}
                {Array.from({ length: Math.ceil(testimonials.length / testimonialsPerPage) }).map((_, pageIndex) => (
                  <div key={pageIndex} className="w-full flex-shrink-0 grid grid-cols-4 gap-4">
                    {testimonials.slice(pageIndex * testimonialsPerPage, (pageIndex + 1) * testimonialsPerPage).map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition"
                      >
                        <div className="flex text-yellow-400 mb-2 text-xs">
                          {'★'.repeat(5)}
                        </div>
                        <p className="text-gray-600 text-sm italic mb-3 leading-relaxed">"{testimonial.quote}"</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${testimonial.bgColor}`}></div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{testimonial.name}</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase">{testimonial.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setTestimonialIndex(index)}
                  className={`w-2 h-2 rounded-full transition ${
                    index === testimonialIndex ? 'bg-brand-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experts Section */}
      <section id="expert" className="py-8 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold italic">Expert Terpopuler</h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">Expert pilihan dengan rating tertinggi dan pengalaman terbaik</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-3">{error}</p>
              <button
                onClick={loadData}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada expert tersedia saat ini.
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-3 gap-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {experts.map((expert) => (
                <div
                  key={expert.id}
                  className="min-w-[260px] md:min-w-[280px] bg-white p-4 rounded-2xl border border-gray-200 text-left hover:shadow-lg hover:-translate-y-1 transition flex flex-col snap-center flex-shrink-0"
                >
                  <div className="flex justify-between items-start mb-3">
                    <img
                      src={expert.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
                      alt={expert.name}
                      width={44}
                      height={44}
                      loading="lazy"
                      decoding="async"
                      className="w-11 h-11 rounded-xl bg-gray-100 border object-cover"
                    />
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> {expert.rating.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-bold text-base italic text-slate-900">{expert.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 font-medium">{expert.role} @ {expert.company}</p>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{expert.location.city}, {expert.location.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-bold bg-gray-50 w-fit px-2 py-0.5 rounded">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{expert.experience}+ Years Experience</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {expert.expertise.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Mulai dari</p>
                      <span className="text-sm font-bold text-brand-600">
                        {getLowestPrice(expert)
                          ? `Rp ${formatPrice(getLowestPrice(expert)!)}`
                          : 'Hubungi'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleExpertClick(expert.slug || expert.id)}
                      className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-brand-200 hover:bg-brand-700 transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/experts')}
              className="px-8 py-3 bg-white border border-gray-200 rounded-full font-bold text-sm hover:border-brand-600 hover:text-brand-600 transition shadow-sm"
            >
              Lihat Semua Expert
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="cara-booking" className="py-10 bg-white border-t border-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold italic mb-2">Mulai dalam Hitungan Detik.</h2>
            <p className="text-gray-500 text-sm">Proses booking yang simpel, transparan, dan cepat.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-gray-100 -z-10 transform scale-x-75"></div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-12 h-12 mx-auto bg-brand-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4 shadow-lg shadow-brand-200 z-10 relative">1</div>
              <h3 className="text-base font-bold italic mb-2">Pilih Expert</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Cari mentor berdasarkan role, perusahaan, atau keahlian spesifik yang kamu butuhkan.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-12 h-12 mx-auto bg-white border-2 border-brand-100 text-brand-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4 z-10 relative">2</div>
              <h3 className="text-base font-bold italic mb-2">Tentukan Jadwal</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Lihat ketersediaan waktu mentor secara real-time dan pilih slot yang pas di kalendermu.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-12 h-12 mx-auto bg-white border-2 border-brand-100 text-brand-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4 z-10 relative">3</div>
              <h3 className="text-base font-bold italic mb-2">Selesaikan & Mulai</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Lakukan pembayaran otomatis. Link Google Meet/Zoom akan dikirim instan ke emailmu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      {articles.length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold italic mb-2">Artikel Terbaru</h2>
                <p className="text-gray-500 text-sm">Tips dan insight untuk karirmu</p>
              </div>
              <Link
                to="/artikel"
                className="hidden md:flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition"
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/artikel/${article.slug}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all"
                >
                  {article.featuredImageUrl ? (
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={article.featuredImageUrl}
                        alt={article.featuredImageAlt || article.title}
                        width={400}
                        height={225}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                      <span className="text-brand-300 text-4xl font-bold">M</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {article.category && (
                        <span className="inline-block px-2.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded">
                          {article.category.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {estimateReadingTime(article.content)} menit
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-6 md:hidden">
              <Link
                to="/artikel"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-sm hover:border-brand-600 hover:text-brand-600 transition shadow-sm"
              >
                Lihat Semua Artikel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-10 bg-brand-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-5 italic">Siap Selesaikan Masalah Karirmu?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-brand-600 px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-xl hover:scale-105 transform duration-200"
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-brand-700 text-white px-8 py-3 rounded-xl font-bold text-sm border border-brand-500 hover:bg-brand-800 transition"
            >
              Masuk ke Akun
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
