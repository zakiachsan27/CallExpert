import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { getExpertByUserId } from '../services/database';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Award } from 'lucide-react';

export function ExpertLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsExpert, isExpertLoggedIn, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Return URL for redirect after login
  const returnUrl = (location.state as any)?.from || '/expert/dashboard';

  // CRITICAL: Redirect to dashboard if already logged in as expert
  useEffect(() => {
    console.log('🔐 ExpertLoginPage: authLoading=', authLoading, 'isExpertLoggedIn=', isExpertLoggedIn);

    if (!authLoading && isExpertLoggedIn) {
      console.log('🔐 ExpertLoginPage: Already logged in, redirecting to dashboard');
      navigate(returnUrl, { replace: true });
    }
  }, [authLoading, isExpertLoggedIn, navigate, returnUrl]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already logged in (prevents flash)
  if (isExpertLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

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

      // Check if user is registered as an expert in the database
      const expert = await getExpertByUserId(data.user.id);

      if (!expert) {
        // Sign out if not an expert
        await supabase.auth.signOut();
        throw new Error('Email ini tidak terdaftar sebagai Expert. Silakan hubungi administrator.');
      }

      // Save token and wait for login to complete
      await loginAsExpert(data.session.access_token, data.user.id);

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

          <form onSubmit={handleLogin} className="space-y-4">
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

        <CardFooter className="border-t border-gray-100 pt-4 pb-4 bg-gray-50/50 rounded-b-3xl">
          {/* Info untuk registrasi */}
          <div className="w-full p-4 bg-brand-50 border border-brand-200 rounded-xl">
            <p className="text-sm text-gray-700 text-center">
              <strong>Belum punya akun expert?</strong><br />
              Hubungi admin untuk mendaftar sebagai expert di platform kami.
            </p>
          </div>
        </CardFooter>

      </Card>

      {/* Footer Copy - Hidden on mobile */}
      <div className="hidden sm:block absolute bottom-6 text-xs text-gray-400 text-center w-full">
        © 2025 MentorinAja. Expert Portal.
      </div>
    </div>
  );
}
