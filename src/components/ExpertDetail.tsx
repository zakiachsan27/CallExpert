import { MapPin, Star, Briefcase, Download, MessageCircle, Zap, Book } from 'lucide-react';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BookingSection } from './BookingSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { Expert, DigitalProduct } from '../App';

type ExpertDetailProps = {
  expert: Expert;
  onBack: () => void;
  onBookingClick?: (sessionTypeId: string) => void;
};

export function ExpertDetail({ expert, onBack, onBookingClick }: ExpertDetailProps) {
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const scrollToSessionTypes = () => {
    if (sidebarRef.current) {
      setTimeout(() => {
        if (sidebarRef.current) {
          const offsetTop = sidebarRef.current.getBoundingClientRect().top + window.pageYOffset;
          const headerHeight = 100;
          window.scrollTo({
            top: offsetTop - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <div className="bg-slate-100 font-sans text-slate-900">
      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto py-8 px-4">

        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-600 transition">Home</Link>
          <span>/</span>
          <Link to="/experts" className="hover:text-brand-600 transition">Expert</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{expert.name.split(' ').slice(0, 2).join(' ')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">

          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-6">

            {/* CARD 1: HEADER PROFIL */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative flex-shrink-0">
                <img
                  src={expert.avatar}
                  alt={expert.name}
                  className="w-24 h-24 rounded-full border-4 border-brand-50 bg-white object-cover"
                />
                {expert.availableNow && (
                  <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-white animate-pulse"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{expert.name}</h1>
                    <p className="text-gray-500 font-medium">{expert.role} @ {expert.company}</p>
                  </div>
                  <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-100 flex items-center gap-1 text-xs font-bold">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{expert.rating}</span>
                    <span className="text-gray-400 font-normal">({expert.reviewCount} Reviews)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {expert.expertise.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{expert.experience}+ Tahun Pengalaman</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{expert.location.city}, {expert.location.country}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: TENTANG SAYA */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span>👋</span> Tentang Saya
                </h3>
                <p>{expert.bio}</p>
              </div>
            </div>

            {/* CARD 3: HIGHLIGHT PROGRAM */}
            {expert.programHighlight && (
              <div className="bg-gradient-to-r from-brand-50 to-white border border-brand-100 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-brand-700 font-bold mb-2 flex items-center gap-2 relative z-10">
                  <Zap className="w-5 h-5" />
                  Program Highlight
                </h3>
                <p className="text-sm text-slate-700 relative z-10 whitespace-pre-wrap">
                  {expert.programHighlight}
                </p>
              </div>
            )}

            {/* CARD 4: PENGALAMAN KERJA */}
            {expert.workExperience && expert.workExperience.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Pengalaman Kerja</h3>
                <div className="space-y-0 pl-2">
                  {expert.workExperience.map((exp, index) => (
                    <div key={index} className={`flex gap-4 relative ${index < expert.workExperience!.length - 1 ? 'pb-8' : ''}`}>
                      {index < expert.workExperience!.length - 1 && (
                        <div className="absolute left-[7px] top-2 bottom-0 w-[2px] bg-gray-200"></div>
                      )}
                      <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-brand-600' : 'bg-gray-300'} border-4 border-white shadow-sm flex-shrink-0 relative z-10`}></div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{exp.title}</h4>
                        <p className="text-xs text-gray-500 mb-1">{exp.company} • {exp.period}</p>
                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARD 5: PENDIDIKAN */}
            {expert.education && expert.education.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🎓</span> Pendidikan
                </h3>
                <ul className="space-y-2">
                  {expert.education.map((edu, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-600 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CARD 6: PENCAPAIAN & SERTIFIKASI */}
            {expert.achievements && expert.achievements.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Pencapaian & Sertifikasi
                </h3>
                <ul className="space-y-2">
                  {expert.achievements.map((achievement, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-600 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="h-10"></div>
          </div>

          {/* --- RIGHT COLUMN (STICKY) --- */}
          <div className="lg:col-span-1">
            <div ref={sidebarRef} className="sticky top-24 space-y-6">

              {/* KONSULTASI CARD */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-100 overflow-hidden">
                <div className="p-4 bg-white border-b border-gray-100">
                  <h3 className="font-bold text-sm text-slate-900">Pilih Sesi Konsultasi</h3>
                  <p className="text-xs text-slate-600">Jadwal tersedia minggu ini</p>
                </div>
                <div className="p-4 space-y-4">
                  {expert.sessionTypes.map((sessionType) => (
                    <div key={sessionType.id}>
                      <div
                        onClick={() => {
                          if (onBookingClick) {
                            onBookingClick(sessionType.id);
                          } else {
                            setSelectedSessionTypeId(sessionType.id);
                          }
                        }}
                        className={`border rounded-xl p-4 transition cursor-pointer group bg-white hover:bg-brand-50/30 ${
                          selectedSessionTypeId === sessionType.id
                            ? 'border-brand-500 bg-brand-50/30'
                            : 'border-gray-200 hover:border-brand-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-700">{sessionType.name}</h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            sessionType.category === 'online-chat'
                              ? 'text-brand-600 bg-brand-50 border-brand-100'
                              : sessionType.category === 'online-video'
                              ? 'text-blue-600 bg-blue-50 border-blue-100'
                              : sessionType.category === 'online-event'
                              ? 'text-green-600 bg-green-50 border-green-100'
                              : 'text-orange-600 bg-orange-50 border-orange-100'
                          }`}>
                            {sessionType.duration} Min
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{sessionType.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-600">{formatPrice(sessionType.price)}</span>
                          <Button
                            size="sm"
                            className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onBookingClick) {
                                onBookingClick(sessionType.id);
                              } else {
                                setSelectedSessionTypeId(sessionType.id);
                              }
                            }}
                          >
                            Book
                          </Button>
                        </div>
                      </div>

                      {/* Booking Section appears immediately after the selected card */}
                      {!onBookingClick && selectedSessionTypeId === sessionType.id && (
                        <div className="mt-3">
                          <Card className="p-4 border-brand-200 bg-brand-50/30">
                            <BookingSection
                              expert={expert}
                              selectedSessionType={sessionType}
                              onBookingComplete={(booking) => {
                                console.log('Booking complete:', booking);
                              }}
                            />
                          </Card>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PRODUK DIGITAL CARD */}
              {expert.digitalProducts && expert.digitalProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Book className="w-4 h-4 text-brand-600" />
                      Produk Digital
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {expert.digitalProducts.map((product) => (
                      <div key={product.id} className="flex items-start gap-3">
                        <div className="w-10 h-12 bg-brand-100 rounded flex items-center justify-center text-brand-600 flex-shrink-0">
                          <span className="text-xs font-bold">
                            {product.type === 'ebook' ? 'PDF' : product.type === 'course' ? 'VID' : 'DOC'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4
                            className="font-bold text-xs text-slate-900 hover:text-brand-600 cursor-pointer"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-600">{formatPrice(product.price)}</span>
                            <Button
                              size="sm"
                              className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm h-8"
                              onClick={() => setSelectedProduct(product)}
                            >
                              Beli
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Sticky Book Meeting Button - FAB (Mobile Only) */}
      <button
        onClick={scrollToSessionTypes}
        className="fixed bottom-6 right-6 mb-safe w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center z-20 transition-all hover:scale-110 lg:hidden"
        aria-label="Book Meeting"
        title="Pesan Sesi Konsultasi"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Digital Product Dialog */}
      <Dialog open={selectedProduct !== null} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Beli Produk Digital</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">{selectedProduct.name}</h3>
                <Badge variant="outline" className="mb-3">
                  {selectedProduct.type === 'ebook' && '📚 E-Book'}
                  {selectedProduct.type === 'course' && '🎓 Course'}
                  {selectedProduct.type === 'template' && '📋 Template'}
                  {selectedProduct.type === 'guide' && '📖 Guide'}
                  {selectedProduct.type === 'other' && '📦 Other'}
                </Badge>
                <p className="text-gray-700 text-sm">{selectedProduct.description}</p>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 text-sm">Harga Produk</span>
                  <span className="text-sm">{formatPrice(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Biaya Admin</span>
                  <span className="text-sm">{formatPrice(2000)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-brand-600">{formatPrice(selectedProduct.price + 2000)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">Setelah pembayaran berhasil:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Link download akan dikirim ke email Anda</li>
                      <li>Akses lifetime untuk produk digital ini</li>
                      <li>Support dari expert tersedia</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedProduct(null)}>
                  Batal
                </Button>
                <Button className="flex-1 bg-brand-600 hover:bg-brand-700" onClick={() => {
                  alert('Fitur pembayaran produk digital akan segera hadir!');
                  setSelectedProduct(null);
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Beli Sekarang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
