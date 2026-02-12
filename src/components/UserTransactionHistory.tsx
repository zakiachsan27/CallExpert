import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  FileText
} from 'lucide-react';
import type { Booking } from '../App';
import { getBookingsByUser } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type UserTransactionHistoryProps = {
  onBack: () => void;
};

export function UserTransactionHistory({ onBack }: UserTransactionHistoryProps) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayCount, setDisplayCount] = useState(5);
  const [showHeader, setShowHeader] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        // Show header when title is scrolled out of view
        setShowHeader(titleRect.top < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchBookings = async () => {
    if (!userId) return;

    try {
      // console.log('Fetching user bookings for user:', userId);
      const data = await getBookingsByUser(userId);
      // console.log('Bookings data:', data);
      // Log first booking to debug price field
      // if (data.length > 0) {
      //   console.log('First booking sample:', data[0]);
      //   console.log('Price fields:', {
      //     totalPrice: data[0].totalPrice,
      //     total_price: data[0].total_price,
      //     price: data[0].price,
      //     session_type_price: data[0].session_type?.price
      //   });
      // }
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat riwayat transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalPrice = (booking: any) => {
    // Try different possible price field names
    return booking.totalPrice ||
           booking.total_price ||
           booking.price ||
           booking.session_type?.price ||
           0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Selesai</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Menunggu Konsultasi</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      {/* Sticky Header - Only visible when scrolled */}
      <div className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 transition-transform duration-300 shadow-sm ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:text-brand-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold italic text-slate-900">Riwayat Transaksi</h2>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8" ref={titleRef}>
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:text-brand-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold italic text-slate-900 tracking-tight">Riwayat Transaksi</h1>
          </div>
          <p className="text-gray-500 ml-14">Lihat semua booking dan transaksi mentoring Anda.</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center">
            <CardContent>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <Button className="mt-4 bg-brand-600 hover:bg-brand-700" onClick={fetchBookings}>
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <Card className="p-12 text-center">
            <CardContent>
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2 font-bold text-lg">Belum Ada Transaksi</h3>
              <p className="text-gray-600 mb-6">
                Anda belum melakukan booking konsultasi dengan expert.
              </p>
              <Button className="bg-brand-600 hover:bg-brand-700" onClick={onBack}>
                Cari Expert
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.slice(0, displayCount).map((booking) => (
              <Card
                key={booking.id}
                className="bg-white border-gray-200 hover:border-brand-200 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/invoice/${booking.order_id || booking.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">

                    {/* Kiri: Avatar & Info Expert */}
                    <div className="flex gap-4 flex-1">
                      <Avatar className="w-14 h-14 border border-gray-100">
                        <AvatarImage src={booking.expert?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.expert?.name}`} alt={booking.expert?.name} />
                        <AvatarFallback>{booking.expert?.name?.[0] || 'E'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{booking.expert?.name || 'Unknown Expert'}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-3">
                          {booking.expert?.role || 'Expert'} {booking.expert?.company ? `@ ${booking.expert.company}` : ''}
                        </p>

                        {/* Detail Transaksi (Tipe & Waktu) */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                            {booking.session_type?.category === 'online-video' ?
                              <Video className="w-3.5 h-3.5 text-brand-600" /> :
                              <MessageCircle className="w-3.5 h-3.5 text-brand-600" />
                            }
                            <span className="font-medium text-xs">{booking.session_type?.name || 'Consultation'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs">{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs">{booking.booking_time} ({booking.session_type?.duration || 60} menit)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kanan: Status & Harga */}
                    <div className="flex flex-row sm:flex-col justify-between items-end sm:items-end min-w-[140px] pl-16 sm:pl-0">
                      <div className="mb-2">
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Total Biaya</p>
                        <p className="font-bold text-brand-700 text-lg">{formatPrice(getTotalPrice(booking))}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Action Footer */}
                <CardFooter className="bg-gray-50/50 px-6 py-3 flex justify-end gap-3 border-t border-gray-100">
                  {/* Lihat Invoice - Always visible */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-brand-600 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/invoice/${booking.order_id || booking.id}`);
                    }}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Lihat Invoice
                  </Button>

                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <>
                      {booking.meeting_link && booking.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-brand-600 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(booking.meeting_link, '_blank');
                          }}
                        >
                          Join Meeting
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-8 rounded-lg shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const expertSlug = booking.expert?.slug || createSlug(booking.expert?.name || 'expert');
                          navigate(`/expert/${expertSlug}`);
                        }}
                      >
                        Book Lagi
                      </Button>
                    </>
                  )}
                  {booking.status === 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete
                      }}
                    >
                      Hapus
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}

            {/* Load More Button */}
            {displayCount < bookings.length && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="rounded-full px-6 text-gray-500 hover:text-brand-600 hover:border-brand-200"
                >
                  Muat Lebih Banyak ({bookings.length - displayCount} lainnya)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}