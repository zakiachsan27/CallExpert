import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Gagal mengirim email reset password. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Terkirim!</h1>
            <p className="text-gray-600 mb-6">
              Kami telah mengirim link reset password ke <strong>{email}</strong>.
              Silakan cek inbox atau folder spam Anda.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-600 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h1>
            <p className="text-gray-600 text-sm">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Link Reset Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
