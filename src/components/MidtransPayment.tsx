import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useMidtransSnap } from '../hooks/useMidtransSnap';
import { createSnapToken, checkPaymentStatus } from '../services/midtrans';
import type { Booking } from '../App';

interface MidtransPaymentProps {
  booking: Booking;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export function MidtransPayment({
  booking,
  onPaymentSuccess,
  onPaymentError,
}: MidtransPaymentProps) {
  const { isSnapLoaded, isLoading: isSnapLoading, openSnap } = useMidtransSnap();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('waiting');

  // Check payment status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkPaymentStatus(booking.id);
        setPaymentStatus(status.payment_status);

        if (status.payment_status === 'paid') {
          onPaymentSuccess();
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    };

    checkStatus();
  }, [booking.id]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create snap token
      const snapData = await createSnapToken({
        bookingId: booking.id,
      });

      // Open Snap popup
      openSnap(snapData.token, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          setPaymentStatus('paid');
          onPaymentSuccess();
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          setPaymentStatus('pending');
          setError('Pembayaran Anda sedang diproses. Silakan cek status booking Anda.');
        },
        onError: (result) => {
          console.error('Payment error:', result);
          setPaymentStatus('failed');
          const errorMessage = 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.';
          setError(errorMessage);
          onPaymentError(errorMessage);
        },
        onClose: () => {
          console.log('Payment popup closed');
          setIsProcessing(false);
        },
      });

      setIsProcessing(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Gagal memproses pembayaran. Silakan coba lagi.';
      setError(errorMessage);
      onPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Pembayaran Berhasil</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Menunggu Pembayaran</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Pembayaran Gagal</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Belum Dibayar</span>
          </div>
        );
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Pembayaran Berhasil!</h3>
          <p className="text-gray-600">
            Booking Anda telah dikonfirmasi dan pembayaran berhasil diproses.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Pembayaran</h3>
        {getPaymentStatusBadge()}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Sesi:</span>
          <span className="font-medium">{booking.sessionType.name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Expert:</span>
          <span className="font-medium">{booking.expert.name}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Durasi:</span>
          <span className="font-medium">{booking.sessionType.duration} menit</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t mt-3">
          <span className="font-semibold">Total Pembayaran:</span>
          <span className="text-xl font-bold text-green-600">
            {formatPrice(booking.totalPrice)}
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handlePayment}
        disabled={isSnapLoading || isProcessing || paymentStatus === 'paid'}
        className="w-full"
        size="lg"
      >
        {isSnapLoading || isProcessing ? (
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

      <p className="text-xs text-gray-500 text-center mt-4">
        Pembayaran aman menggunakan Midtrans
      </p>
    </Card>
  );
}
