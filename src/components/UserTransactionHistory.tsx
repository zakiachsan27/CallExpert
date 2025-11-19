import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Video, 
  MessageCircle, 
  Users, 
  MapPinned,
  CheckCircle,
  XCircle,
  Loader2,
  Receipt
} from 'lucide-react';
import type { Booking } from '../App';
import { projectId } from '../utils/supabase/info.tsx';

type UserTransactionHistoryProps = {
  accessToken: string;
  onBack: () => void;
};

export function UserTransactionHistory({ accessToken, onBack }: UserTransactionHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      console.log('Fetching user bookings with access token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/user/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('Bookings response:', { ok: response.ok, status: response.status });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch bookings:', errorData);
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Bookings data:', data);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Terkonfirmasi</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Menunggu</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'online-chat':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'online-video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'online-event':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'offline-event':
        return <MapPinned className="w-5 h-5 text-blue-600" />;
      default:
        return <Calendar className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="w-8 h-8 text-blue-600" />
            <h1>Riwayat Transaksi</h1>
          </div>
          <p className="text-gray-600">
            Lihat semua booking dan transaksi konsultasi Anda
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <Button className="mt-4" onClick={fetchBookings}>
              Coba Lagi
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <Card className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="mb-2">Belum Ada Transaksi</h3>
            <p className="text-gray-600 mb-6">
              Anda belum melakukan booking konsultasi dengan expert.
            </p>
            <Button onClick={onBack}>
              Cari Expert
            </Button>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Expert Avatar */}
                      <img
                        src={booking.expert.avatar}
                        alt={booking.expert.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="mb-1">{booking.expert.name}</h3>
                            <p className="text-gray-600 text-sm">
                              {booking.expert.role} at {booking.expert.company}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <Separator className="my-3" />

                        {/* Session Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(booking.sessionType.category)}
                            <div>
                              <p className="text-sm text-gray-500">Tipe Sesi</p>
                              <p>{booking.sessionType.name}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Tanggal</p>
                              <p>{formatDate(booking.date)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Waktu</p>
                              <p>{booking.time} ({booking.sessionType.duration} menit)</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Total Biaya</p>
                              <p className="text-green-600">{formatPrice(booking.totalPrice)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Link - Only show for confirmed online sessions */}
                    {booking.status === 'confirmed' && booking.meetingLink && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm mb-2">Link Meeting:</p>
                        <a 
                          href={booking.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {booking.meetingLink}
                        </a>
                      </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-gray-500 mb-1">Catatan:</p>
                        <p className="text-gray-700">{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {booking.status === 'confirmed' && (
                      <>
                        <Button className="flex-1 lg:flex-none" size="sm">
                          Hubungi Expert
                        </Button>
                        {booking.meetingLink && (
                          <Button 
                            variant="outline" 
                            className="flex-1 lg:flex-none" 
                            size="sm"
                            onClick={() => window.open(booking.meetingLink, '_blank')}
                          >
                            Join Meeting
                          </Button>
                        )}
                      </>
                    )}
                    {booking.status === 'pending' && (
                      <Button variant="outline" className="flex-1 lg:flex-none" size="sm">
                        Batalkan
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}