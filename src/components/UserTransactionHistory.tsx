import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getBookingsByUser } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type UserTransactionHistoryProps = {
  onBack: () => void;
};

export function UserTransactionHistory({ onBack }: UserTransactionHistoryProps) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const fetchBookings = async () => {
    if (!userId) return;

    try {
      console.log('Fetching user bookings for user:', userId);
      const data = await getBookingsByUser(userId);
      console.log('Bookings data:', data);
      // Filter only paid bookings
      const paidBookings = data.filter((booking: any) => booking.payment_status === 'paid');
      setBookings(paidBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat riwayat transaksi');
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

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'waiting':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Menunggu</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
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

  const handleCardClick = (orderId: string) => {
    navigate(`/invoice/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Card
                key={booking.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCardClick(booking.order_id || booking.id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Expert Avatar */}
                      <img
                        src={booking.expert?.avatar_url || 'https://via.placeholder.com/64'}
                        alt={booking.expert?.name || 'Expert'}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="mb-1">{booking.expert?.name || 'Unknown Expert'}</h3>
                            <p className="text-gray-600 text-sm">
                              {booking.expert?.role || 'Expert'} {booking.expert?.company ? `at ${booking.expert.company}` : ''}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              ID: {booking.order_id || booking.id}
                            </p>
                          </div>
                          {getStatusBadge(booking.payment_status)}
                        </div>

                        <Separator className="my-3" />

                        {/* Session Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(booking.session_type?.category || 'online-video')}
                            <div>
                              <p className="text-sm text-gray-500">Tipe Sesi</p>
                              <p>{booking.session_type?.name || 'Consultation'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Tanggal</p>
                              <p>{formatDate(booking.booking_date)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Waktu</p>
                              <p>{booking.booking_time} ({booking.session_type?.duration || 60} menit)</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Total Biaya</p>
                              <p className="text-green-600">{formatPrice(booking.total_price || 0)}</p>
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

                  {/* Actions removed as per requirement */}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}