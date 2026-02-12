import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Memverifikasi pembayaran...');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) {
      setStatus('failed');
      setMessage('Booking ID tidak ditemukan');
      return;
    }

    verifyPayment();
  }, [bookingId]);

  const verifyPayment = async () => {
    try {
      // console.log('🔍 Verifying payment for booking:', bookingId);

      // Call verify-payment Edge Function
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { bookingId }
      });

      // console.log('📥 Verification response:', { data, error });

      if (error) {
        throw error;
      }

      if (data.success) {
        setStatus('success');
        setMessage('Pembayaran berhasil diverifikasi!');
        setPaymentDetails(data);

        // Redirect to invoice page after 3 seconds
        // Use order_id if available, fallback to bookingId
        const invoiceId = data.order_id || bookingId;
        setTimeout(() => {
          navigate(`/invoice/${invoiceId}`);
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(data.message || 'Verifikasi pembayaran gagal');
      }
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      setStatus('failed');
      setMessage(error.message || 'Terjadi kesalahan saat memverifikasi pembayaran');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 rounded-3xl border border-gray-100">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-brand-600 animate-spin mb-4" />
              <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 mb-2">Memverifikasi Pembayaran</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <p className="text-sm text-gray-400">Mohon tunggu sebentar...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-bold italic tracking-tight text-green-600 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-500 mb-6">{message}</p>

              {paymentDetails && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="font-mono text-sm mb-3">{paymentDetails.order_id}</p>

                  <p className="text-sm text-gray-600 mb-1">Status Transaksi</p>
                  <p className="font-semibold text-green-600 mb-3">{paymentDetails.transaction_status}</p>

                  <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
                  <p className="font-semibold text-green-600">{paymentDetails.payment_status}</p>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-4">
                Anda akan diarahkan ke halaman invoice dalam 3 detik...
              </p>

              <Button
                onClick={() => navigate(`/invoice/${paymentDetails?.order_id || bookingId}`)}
                className="w-full bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition"
              >
                Lihat Invoice Sekarang
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold italic tracking-tight text-red-600 mb-2">Verifikasi Gagal</h1>
              <p className="text-gray-500 mb-6">{message}</p>

              <div className="space-y-3">
                <Button
                  onClick={verifyPayment}
                  variant="outline"
                  className="w-full hover:border-brand-600 hover:text-brand-600"
                >
                  Coba Lagi
                </Button>

                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition"
                >
                  Kembali ke Beranda
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
