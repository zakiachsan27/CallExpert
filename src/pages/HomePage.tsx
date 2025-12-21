import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Search, Star, MapPin, Briefcase, Check, MessageCircle, CalendarCheck } from 'lucide-react';
import { getExperts } from '../services/database';
import type { Expert } from '../App';

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

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExperts() {
      try {
        const data = await getExperts();
        // Get top 4 experts by rating
        const sortedExperts = data.sort((a, b) => b.rating - a.rating).slice(0, 4);
        setExperts(sortedExperts);
      } catch (error) {
        console.error('Error loading experts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExperts();
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
      <div className="relative pt-20 pb-20 px-4 border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-white bg-grid-pattern pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white, transparent)' }} />
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wide mb-6 border border-brand-100">
            Platform Mentoring #1 Indonesia
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 italic leading-tight">
            Selesaikan Isu Karirmu <br/>
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 text-gradient-fix">
              Lewat Mentoring.
            </span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dapatkan solusi nyata untuk masalah kerjamu dari para praktisi ahli yang sudah berpengalaman di bidangnya.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto shadow-2xl shadow-brand-100 rounded-full group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-14 pr-4 py-5 rounded-full border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 shadow-sm transition"
              placeholder="Cari mentor (Misal: Senior PM, UX Designer)..."
            />
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-brand-500 transition" />
            </div>
          </form>

          <div className="mt-8 flex justify-center items-center gap-4 text-xs text-gray-400 font-medium">
            <p className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Dipercaya 5,000+ Profesional di Indonesia
            </p>
          </div>
        </div>
      </div>

      {/* Why MentorinAja Section */}
      <section className="py-12 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold italic text-slate-900">Why MentorinAja?</h2>
            <p className="text-gray-500 mt-4 text-lg">Alasan mengapa ribuan profesional memilih bimbingan di sini.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100 hover:shadow-xl hover:-translate-y-1 transition">
              <div className="w-14 h-14 bg-brand-50 border border-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 italic text-slate-900">Expert Terverifikasi</h3>
              <p className="text-gray-500 leading-relaxed">Semua expert melalui seleksi ketat untuk memastikan bimbingan berkualitas tinggi.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100 hover:shadow-xl hover:-translate-y-1 transition">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 italic text-slate-900">Metode Interaksi Beragam</h3>
              <p className="text-gray-500 leading-relaxed">Konsultasi fleksibel via real-time chat, video call, hingga undang expert ke event kantor.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100 hover:shadow-xl hover:-translate-y-1 transition">
              <div className="w-14 h-14 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 italic text-slate-900">Jadwal Fleksibel</h3>
              <p className="text-gray-500 leading-relaxed">Sinkronisasi kalender otomatis. Atur waktu sesi sesuai kenyamananmu tanpa ribet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testi" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold italic">Bantu Selesaikan Isu Karirmu</h2>
            <p className="text-gray-500 mt-3 text-lg">Dengarkan cerita sukses dari user kami.</p>
          </div>

          <div className="flex overflow-x-auto pb-6 gap-5 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="min-w-[200px] max-w-[240px] md:min-w-[220px] md:max-w-[260px] p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 transition snap-center flex-shrink-0"
              >
                <div className="flex text-yellow-400 mb-3 text-sm">
                  {'★'.repeat(5)}
                </div>
                <p className="text-gray-600 text-base italic mb-4 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${testimonial.bgColor}`}></div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 font-bold uppercase">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Experts Section */}
      <section id="expert" className="py-10 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold italic">Expert Terpopuler</h2>
            <p className="text-gray-500 mt-3 text-lg">Expert pilihan dengan rating tertinggi dan pengalaman terbaik</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada expert tersedia saat ini.
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {experts.map((expert) => (
                <div
                  key={expert.id}
                  className="min-w-[300px] md:min-w-[320px] bg-white p-6 rounded-3xl border border-gray-200 text-left hover:shadow-xl hover:-translate-y-1 transition flex flex-col snap-center flex-shrink-0"
                >
                  <div className="flex justify-between items-start mb-4">
                    <img
                      src={expert.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.name}`}
                      alt={expert.name}
                      className="w-14 h-14 rounded-2xl bg-gray-100 border object-cover"
                    />
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> {expert.rating.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg italic text-slate-900">{expert.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 font-medium">{expert.role} @ {expert.company}</p>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{expert.location.city}, {expert.location.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-gray-50 w-fit px-2 py-1 rounded">
                      <Briefcase className="w-4 h-4" />
                      <span>{expert.experience}+ Years Experience</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {expert.expertise.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Mulai dari</p>
                      <span className="text-base font-bold text-brand-600">
                        {getLowestPrice(expert)
                          ? `Rp ${formatPrice(getLowestPrice(expert)!)}`
                          : 'Hubungi'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleExpertClick(expert.slug || expert.id)}
                      className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition"
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
      <section id="cara-booking" className="py-12 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold italic mb-4">Mulai dalam Hitungan Detik.</h2>
            <p className="text-gray-500">Proses booking yang simpel, transparan, dan cepat.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10 transform scale-x-75"></div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-16 h-16 mx-auto bg-brand-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-brand-200 z-10 relative">1</div>
              <h3 className="text-xl font-bold italic mb-3">Pilih Expert</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Cari mentor berdasarkan role, perusahaan, atau keahlian spesifik yang kamu butuhkan.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-brand-100 text-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 z-10 relative">2</div>
              <h3 className="text-xl font-bold italic mb-3">Tentukan Jadwal</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Lihat ketersediaan waktu mentor secara real-time dan pilih slot yang pas di kalendermu.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center hover:border-brand-200 hover:shadow-lg transition relative">
              <div className="w-16 h-16 mx-auto bg-white border-2 border-brand-100 text-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 z-10 relative">3</div>
              <h3 className="text-xl font-bold italic mb-3">Selesaikan & Mulai</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Lakukan pembayaran otomatis. Link Google Meet/Zoom akan dikirim instan ke emailmu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 italic">Siap Selesaikan Masalah Karirmu?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-brand-600 px-10 py-4 rounded-2xl font-bold hover:bg-gray-50 transition shadow-2xl hover:scale-105 transform duration-200"
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold border border-brand-500 hover:bg-brand-800 transition"
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
