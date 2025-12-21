import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Award, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

type ExpertLoginProps = {
  onLoginSuccess: (accessToken: string, expertId: string) => void;
  onBack: () => void;
};

export function ExpertLogin({ onLoginSuccess, onBack }: ExpertLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Login using Supabase Auth
      console.log('Attempting expert login for:', email);
      const response = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Expert login response:', { ok: response.ok, data });

      if (!response.ok) {
        setError(data.error_description || data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (data.access_token && data.user?.id) {
        console.log('Expert login successful for user:', data.user.id);
        onLoginSuccess(data.access_token, data.user.id);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Background Pattern (Konsisten dengan Hero Landing Page) */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none opacity-50"></div>

      <Card className="w-full max-w-md border-gray-200 shadow-xl shadow-brand-100/50 relative z-10">

        {/* Header Card */}
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-start mb-4">
            <button
              onClick={onBack}
              className="text-xs font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4 mx-auto">
            <Award className="w-8 h-8 text-brand-600" />
          </div>
          <CardTitle className="text-2xl font-bold italic text-slate-900 tracking-tight">
            Login Expert
          </CardTitle>
          <CardDescription className="text-gray-500">
            Masuk untuk mengelola profil dan konsultasi Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-2 text-sm font-bold">Login Gagal</AlertTitle>
              <AlertDescription className="ml-2 text-xs opacity-90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <Link to="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Lupa Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl py-6 shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Login Sekarang'
              )}
            </Button>
          </form>

        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-gray-50 pt-6 bg-gray-50/50 rounded-b-3xl">
          {/* Info untuk registrasi */}
          <div className="w-full p-4 bg-brand-50 border border-brand-200 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              <strong>Belum punya akun expert?</strong><br />
              Hubungi admin untuk mendaftar sebagai expert di platform kami.
            </p>
          </div>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-400">Atau</span>
            </div>
          </div>

          <div className="text-center w-full">
             <Link to="/login" className="text-xs font-semibold text-gray-500 hover:text-brand-600 transition flex items-center justify-center gap-2">
               Anda seorang User? <span className="text-brand-600">Login di sini</span>
             </Link>
          </div>
        </CardFooter>

      </Card>

      {/* Footer Copy */}
      <div className="absolute bottom-6 text-xs text-gray-400 text-center w-full">
        © 2025 MentorinAja. Expert Portal.
      </div>
    </div>
  );
}
