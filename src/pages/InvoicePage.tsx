import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Download,
  ArrowLeft,
  Printer,
  FileText,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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

      openSnap(snapData.token, {
        onSuccess: async (result) => {
          console.log('Payment success:', result);
          navigate(`/payment/success?booking_id=${booking.id}`);
        },
        onPending: async (result) => {
          console.log('Payment pending:', result);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    alert('Fitur download PDF akan segera hadir');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold italic tracking-tight text-slate-900 mb-2">
            {error || 'Invoice tidak ditemukan'}
          </h2>
          <Button onClick={() => navigate('/')} className="mt-4 bg-brand-600 hover:bg-brand-700">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isPending = booking.payment_status === 'waiting';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none opacity-60"></div>

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Navigation & Actions */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/user/transactions" className="text-sm font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={handleDownloadPDF}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>
        </div>

        {/* INVOICE CARD */}
        <Card className="border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">

          {/* Header Invoice */}
          <CardHeader className="bg-white border-b border-gray-50 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold italic text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-brand-600" />
                  Invoice
                </h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">
                  ID: {booking.order_id}
                </p>
              </div>
              {isPaid && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                  Lunas
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                  Menunggu Pembayaran
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">

            {/* 1. Expert Profile Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detail Sesi Konsultasi</h3>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Avatar className="w-12 h-12 border border-white shadow-sm">
                  <AvatarImage src={booking.expert?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.expert?.name}`} />
                  <AvatarFallback>{booking.expert?.name?.[0] || 'E'}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-slate-900">{booking.expert?.name || 'Unknown Expert'}</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {booking.expert?.role || 'Expert'} {booking.expert?.company ? `@ ${booking.expert.company}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Session Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tipe Sesi</p>
                    <p className="text-sm font-semibold text-slate-900">{booking.session_type?.name || 'Consultation'}</p>
                    <p className="text-[10px] text-gray-400">Durasi: {booking.session_type?.duration || 60} menit</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Topik & Catatan</p>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{booking.topic || 'Konsultasi'}</p>
                    {booking.notes && (
                      <p className="text-[10px] text-gray-400 italic mt-0.5">"{booking.notes}"</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tanggal</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(booking.booking_date)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Waktu</p>
                    <p className="text-sm font-semibold text-slate-900">{booking.booking_time}</p>
                  </div>
                </div>
                {booking.session_type?.category === 'offline-event' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 text-pink-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Lokasi</p>
                      <p className="text-sm font-semibold text-slate-900">{booking.expert?.location_city || 'Akan ditentukan'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* 3. Payment Breakdown */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rincian Pembayaran</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Harga Sesi</span>
                  <span>{formatPrice(booking.total_price)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Admin</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                  <span className="font-bold text-slate-900">Total Pembayaran</span>
                  <span className="font-bold text-brand-600 text-lg">{formatPrice(booking.total_price)}</span>
                </div>
              </div>
            </div>

            {/* 4. Payment Status */}
            {isCheckingPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800">Memverifikasi Pembayaran...</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Mohon tunggu, kami sedang memverifikasi pembayaran Anda.
                  </p>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-green-800">Pembayaran Berhasil</h4>
                  <p className="text-xs text-green-700 mt-0.5">
                    Dibayar pada: {formatDateTime(booking.paid_at || booking.updated_at)}
                  </p>
                </div>
              </div>
            )}

          </CardContent>

          {/* Footer Actions */}
          <CardFooter className="bg-gray-50/50 p-6 sm:p-8 border-t border-gray-100 flex flex-col gap-3">
            {/* Chat/Meeting Access for Paid Bookings */}
            {isPaid && booking.session_type?.category === 'online-chat' && (
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2 font-medium">Akses Chat Konsultasi:</p>
                <Button
                  onClick={() => navigate(`/session?bookingId=${booking.id}`)}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Masuk ke Chat Room
                </Button>
              </div>
            )}

            {isPaid && booking.session_type?.category === 'online-video' && booking.meeting_link && (
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2 font-medium">Link Video Call:</p>
                <Button
                  onClick={() => window.open(booking.meeting_link, '_blank')}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Buka Google Meet
                </Button>
              </div>
            )}

            {/* Payment Button for Pending */}
            {isPending && (
              <Button
                onClick={handlePayNow}
                disabled={isProcessingPayment}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
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

            {/* Back to Home */}
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200">
                Kembali ke Beranda
              </Button>
            </Link>
          </CardFooter>

        </Card>

        <div className="text-center mt-8 text-xs text-gray-400">
          <p>© 2025 MentorinAja. Invoice ini sah dan diterbitkan secara otomatis.</p>
          <p className="mt-1">Booking dibuat pada: {formatDateTime(booking.created_at)}</p>
        </div>

      </div>
    </div>
  );
}
