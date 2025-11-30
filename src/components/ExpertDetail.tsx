import { ArrowLeft, MapPin, Star, Award, Briefcase, GraduationCap, Calendar, ChevronRight, TrendingUp, MessageCircle, Download, Video, Users, MapPinned } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BookingSection } from './BookingSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { Expert, Booking, DigitalProduct } from '../App';

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

  const selectedSessionType = expert.sessionTypes.find(st => st.id === selectedSessionTypeId);

  const scrollToSessionTypes = () => {
    if (sidebarRef.current) {
      // Use setTimeout to wait for the DOM to update
      setTimeout(() => {
        if (sidebarRef.current) {
          const offsetTop = sidebarRef.current.getBoundingClientRect().top + window.pageYOffset;
          const headerHeight = 100; // Height of sticky header + some padding
          window.scrollTo({
            top: offsetTop - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Expert
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar with Availability Status */}
                <div className="relative">
                  <img
                    src={expert.avatar}
                    alt={expert.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  {/* Availability Badge */}
                  {expert.availability === 'online' ? (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
                        Online Now
                      </Badge>
                    </div>
                  ) : (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge variant="secondary">
                        Offline
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div>
                    <h1>{expert.name}</h1>
                    <p className="text-gray-600 mt-1">{expert.role} at {expert.company}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span>{expert.rating}</span>
                      <span className="text-gray-500">({expert.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{expert.experience}+ years exp</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{expert.location.city}, {expert.location.country}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {expert.expertise.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card className="p-6">
              <h2>Tentang</h2>
              <p className="text-gray-700 mt-3 leading-relaxed">{expert.bio}</p>
            </Card>

            {/* Program Highlight */}
            {expert.programHighlight && (
              <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2 className="text-blue-900">Program Highlight</h2>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{expert.programHighlight}</p>
              </Card>
            )}

            {/* Achievements - moved here after Program Highlight */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-blue-600" />
                <h2>Pencapaian & Sertifikasi</h2>
              </div>
              <ul className="space-y-3">
                {expert.achievements?.map((achievement, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{achievement}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Work Experience */}
            {expert.workExperience && expert.workExperience.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h2>Pengalaman Kerja</h2>
                </div>
                <div className="space-y-6">
                  {expert.workExperience.map((exp, index) => (
                    <div key={index}>
                      {index > 0 && <Separator className="mb-6" />}
                      <div>
                        <h3>{exp.title}</h3>
                        <p className="text-gray-600 mt-1">{exp.company}</p>
                        <p className="text-gray-500 mt-1">{exp.period}</p>
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Education */}
            {expert.education && expert.education.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <h2>Pendidikan</h2>
                </div>
                <ul className="space-y-2">
                  {expert.education.map((edu, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{edu}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Skills */}
            {expert.skills && expert.skills.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2>Keahlian</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expert.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="lg:col-span-1">
            <div ref={sidebarRef} className="space-y-4 lg:sticky lg:top-24">
              <Card className="p-6">
                <h3 className="mb-4">Tipe Sesi Konsultasi</h3>

                <div className="space-y-3">
                  {expert.sessionTypes.map((sessionType) => (
                    <div key={sessionType.id}>
                      {/* Session Type Card */}
                      <div
                        onClick={() => {
                          if (onBookingClick) {
                            onBookingClick(sessionType.id);
                          } else {
                            setSelectedSessionTypeId(sessionType.id);
                          }
                        }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedSessionTypeId === sessionType.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          {/* Category Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {sessionType.category === 'online-chat' && <MessageCircle className="w-5 h-5 text-blue-600" />}
                            {sessionType.category === 'online-video' && <Video className="w-5 h-5 text-blue-600" />}
                            {sessionType.category === 'online-event' && <Users className="w-5 h-5 text-blue-600" />}
                            {sessionType.category === 'offline-event' && <MapPinned className="w-5 h-5 text-blue-600" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-gray-900">{sessionType.name}</h4>
                              <ChevronRight className={`w-5 h-5 transition-transform flex-shrink-0 ml-2 ${selectedSessionTypeId === sessionType.id ? 'rotate-90 text-blue-600' : 'text-gray-400'
                                }`} />
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {sessionType.category === 'online-chat' && '💬 Online Chat'}
                              {sessionType.category === 'online-video' && '📹 Google Meet'}
                              {sessionType.category === 'online-event' && '🎯 Group Event'}
                              {sessionType.category === 'offline-event' && `☕ Offline - ${expert.location.city}`}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2 ml-8">{sessionType.description}</p>
                        <div className="flex justify-between items-center ml-8">
                          <p className="text-gray-500 text-sm">{sessionType.duration} menit</p>
                          <p className="text-green-600">{formatPrice(sessionType.price)}</p>
                        </div>
                      </div>

                      {/* Booking Section appears immediately after the selected card */}
                      {!onBookingClick && selectedSessionTypeId === sessionType.id && (
                        <div className="mt-3">
                          <Card className="p-6" ref={bookingSectionRef}>
                            <BookingSection
                              expert={expert}
                              selectedSessionType={sessionType}
                              onBookingComplete={(booking) => {
                                // This is fallback for when onBookingClick is not provided
                                console.log('Booking complete:', booking);
                              }}
                            />
                          </Card>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              {/*Digital Products */}
              {expert.digitalProducts && expert.digitalProducts.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="w-5 h-5 text-blue-600" />
                    <h3>Produk Digital</h3>
                  </div>
                  <div className="space-y-3">
                    {expert.digitalProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:border-blue-300 transition-all cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-gray-900 mb-1">{product.name}</h4>
                            <Badge variant="outline" className="text-xs mb-2">
                              {product.type === 'ebook' && '📚 E-Book'}
                              {product.type === 'course' && '🎓 Course'}
                              {product.type === 'template' && '📋 Template'}
                              {product.type === 'guide' && '📖 Guide'}
                              {product.type === 'other' && '📦 Other'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-green-600">{formatPrice(product.price)}</p>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Beli
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Book Meeting Button - FAB */}
      <button
        onClick={scrollToSessionTypes}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-20 transition-all hover:scale-110 lg:hidden"
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
                <h3 className="mb-2">{selectedProduct.name}</h3>
                <Badge variant="outline" className="mb-3">
                  {selectedProduct.type === 'ebook' && '📚 E-Book'}
                  {selectedProduct.type === 'course' && '🎓 Course'}
                  {selectedProduct.type === 'template' && '📋 Template'}
                  {selectedProduct.type === 'guide' && '📖 Guide'}
                  {selectedProduct.type === 'other' && '📦 Other'}
                </Badge>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Harga Produk</span>
                  <span>{formatPrice(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span>{formatPrice(2000)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(selectedProduct.price + 2000)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">Setelah pembayaran berhasil:</p>
                    <ul className="list-disc list-inside space-y-1">
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
                <Button className="flex-1" onClick={() => {
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