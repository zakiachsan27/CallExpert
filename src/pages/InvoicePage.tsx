import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Clock, User, Briefcase, MapPin, CheckCircle, AlertCircle, CreditCard, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { getBookingByOrderId, getBookingById } from '../services/database';
import { createSnapToken } from '../services/midtrans';
import { useMidtransSnap } from '../hooks/useMidtransSnap';

export function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isSnapLoaded, openSnap } = useMidtransSnap();
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchBooking();
    }
  }, [orderId]);

  // Auto-trigger payment popup for pending bookings
  useEffect(() => {
    if (booking && booking.payment_status === 'waiting' && isSnapLoaded && !isProcessingPayment) {
      console.log('Auto-triggering payment for new booking');
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        handlePayNow();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [booking, isSnapLoaded]);

  const fetchBooking = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!orderId) {
        setError('Order ID tidak valid');
        return;
      }

      // Try to fetch by order_id first
      let bookingData = await getBookingByOrderId(orderId);

      // If not found, try by booking ID (UUID format)
      if (!bookingData && orderId.includes('-')) {
        console.log('Order ID not found, trying as booking ID:', orderId);
        bookingData = await getBookingById(orderId);
      }

      if (!bookingData) {
        setError('Invoice tidak ditemukan');
        return;
      }

      setBooking(bookingData);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Gagal memuat invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (maxAttempts = 10, interval = 2000) => {
    let attempts = 0;
    setIsCheckingPayment(true);

    const poll = async (): Promise<boolean> => {
      attempts++;
      console.log(`Polling payment status, attempt ${attempts}/${maxAttempts}`);

      try {
        const bookingData = await getBookingByOrderId(orderId!);

        if (bookingData && bookingData.payment_status === 'paid') {
          console.log('Payment confirmed as paid');
          setBooking(bookingData);
          setIsCheckingPayment(false);
          return true;
        }

        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, interval));
          return poll();
        }

        console.log('Payment status polling timed out, refreshing anyway');
        if (bookingData) {
          setBooking(bookingData);
        }
        setIsCheckingPayment(false);
        return false;
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, interval));
          return poll();
        }
        setIsCheckingPayment(false);
        return false;
      }
    };

    return poll();
  };

  const handlePayNow = async () => {
    if (!booking) return;

    setIsProcessingPayment(true);
    try {
      const snapData = await createSnapToken({ bookingId: booking.id });

      // Use openSnap from hook
      openSnap(snapData.token, {
        onSuccess: async (result) => {
          console.log('Payment success:', result);
          // Redirect to payment success page for verification
          navigate(`/payment/success?booking_id=${booking.id}`);
        },
        onPending: async (result) => {
          console.log('Payment pending:', result);
          // Redirect to payment success page for verification
          navigate(`/payment/success?booking_id=${booking.id}`);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          alert('Pembayaran gagal. Silakan coba lagi.');
          setIsProcessingPayment(false);
        },
        onClose: () => {
          setIsProcessingPayment(false);
        }
      });
    } catch (error) {
      console.error('Error creating snap token:', error);
      alert('Gagal memproses pembayaran. Silakan coba lagi.');
      setIsProcessingPayment(false);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Invoice tidak ditemukan'}
          </h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isPending = booking.payment_status === 'waiting';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
              <p className="text-gray-600 mt-1">Order ID: {booking.order_id}</p>
            </div>
            {isPaid && (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Lunas
              </Badge>
            )}
            {isPending && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-4 h-4 mr-1" />
                Menunggu Pembayaran
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 sm:p-8">
          {/* Booking Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Detail Sesi Konsultasi</h2>

              {/* Expert Info */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={booking.expert.avatar_url || 'https://via.placeholder.com/100'}
                  alt={booking.expert.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{booking.expert.name}</h3>
                  <p className="text-gray-600">{booking.expert.role}</p>
                  <p className="text-gray-500">{booking.expert.company}</p>
                </div>
              </div>

              {/* Session Details */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{booking.session_type.name}</p>
                    <p className="text-sm text-gray-500">{booking.session_type.duration} menit</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{formatDate(booking.booking_date)}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{booking.booking_time}</span>
                </div>

                {booking.session_type.category === 'offline-event' && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Lokasi Pertemuan</p>
                      <p className="text-sm text-gray-500">
                        {booking.expert.location_city || 'Lokasi akan ditentukan'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-gray-700">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Topik Konsultasi</p>
                    <p className="text-sm text-gray-500">{booking.topic}</p>
                    {booking.notes && (
                      <p className="text-sm text-gray-500 mt-1">Catatan: {booking.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Rincian Harga</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Harga Sesi</span>
                  <span>{formatPrice(booking.total_price)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Biaya Admin</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(booking.total_price)}</span>
                </div>
              </div>
            </div>

            {isCheckingPayment && (
              <>
                <Separator />
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <h3 className="font-semibold">Memverifikasi Pembayaran...</h3>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Mohon tunggu, kami sedang memverifikasi pembayaran Anda.
                  </p>
                </div>
              </>
            )}

            {isPaid && (
              <>
                <Separator />
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Pembayaran Berhasil</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Dibayar pada: {formatDateTime(booking.paid_at || booking.updated_at)}
                  </p>

                  {/* Meeting Link for Video Call */}
                  {booking.session_type.category === 'online-video' && booking.meeting_link && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-green-700 mb-2">Link Video Call:</p>
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Buka Google Meet
                      </a>
                    </div>
                  )}

                  {/* Chat Link for Online Chat */}
                  {booking.session_type.category === 'online-chat' && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-green-700 mb-2">Akses Chat Konsultasi:</p>
                      <Button
                        onClick={() => navigate(`/session?bookingId=${booking.id}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Masuk ke Chat
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/')}
              >
                Kembali ke Beranda
              </Button>
              {isPending && (
                <Button
                  className="flex-1"
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Bayar Sekarang
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Booking Created Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Booking dibuat pada: {formatDateTime(booking.created_at)}
        </div>
      </div>
    </div>
  );
}
