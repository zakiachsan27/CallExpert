import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Return URL for redirect after login
  const returnUrl = (location.state as any)?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Real authentication with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.session) {
        throw new Error('Login gagal. Silakan coba lagi.');
      }

      // Check user metadata for role
      const userRole = data.user.user_metadata?.role;

      if (userRole !== 'user') {
        throw new Error('Email ini tidak terdaftar sebagai User. Silakan login sebagai Expert.');
      }

      // Save token
      loginAsUser(data.session.access_token);

      // Redirect to return URL or default
      navigate(returnUrl, { replace: true });

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Silakan coba lagi.');
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
            Masuk ke Akun
          </CardTitle>
          <CardDescription className="text-gray-500">
            Masukkan detail akun Anda untuk melanjutkan mentoring.
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

          <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="text-center text-sm text-gray-500">
            Belum punya akun?{" "}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Daftar Gratis
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
        © 2025 MentorinAja. Secure Login.
      </div>
    </div>
  );
}
