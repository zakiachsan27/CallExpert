import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { ArrowLeft, Loader2, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Semua field harus diisi');
      }

      if (password !== confirmPassword) {
        throw new Error('Password dan konfirmasi password tidak cocok');
      }

      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }

      // Create account with Supabase (via backend)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/user/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey,
          },
          body: JSON.stringify({
            email,
            password,
            name
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registrasi gagal');
      }

      const data = await response.json();

      // Auto login after successful registration
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError || !loginData.session) {
        // Registration successful but auto-login failed
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Save token
      loginAsUser(loginData.session.access_token);
      navigate('/', { replace: true });

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
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
            <Link
              to="/"
              className="text-xs font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold italic text-slate-900 tracking-tight">
            Daftar Gratis
          </CardTitle>
          <CardDescription className="text-gray-500">
            Buat akun untuk mulai perjalanan mentoring Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="ml-2 text-sm font-bold">Registrasi Berhasil!</AlertTitle>
              <AlertDescription className="ml-2 text-xs opacity-90">
                Mengalihkan ke halaman login...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-2 text-sm font-bold">Registrasi Gagal</AlertTitle>
              <AlertDescription className="ml-2 text-xs opacity-90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Input Nama */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap Anda"
                  className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="namamu@email.com"
                  className="pl-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
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
              <p className="text-xs text-gray-500">Minimal 6 karakter</p>
            </div>

            {/* Input Konfirmasi Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl py-6 shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </Button>
          </form>

        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-gray-50 pt-6 bg-gray-50/50 rounded-b-3xl">
          <div className="text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-bold text-brand-600 hover:underline">
              Login di sini
            </Link>
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
             <Link to="/expert/login" className="text-xs font-semibold text-gray-500 hover:text-brand-600 transition flex items-center justify-center gap-2">
               Anda seorang Expert? <span className="text-brand-600">Login di sini</span>
             </Link>
          </div>
        </CardFooter>

      </Card>

      {/* Footer Copy */}
      <div className="absolute bottom-6 text-xs text-gray-400 text-center w-full">
        © 2025 MentorinAja. Secure Registration.
      </div>
    </div>
  );
}
