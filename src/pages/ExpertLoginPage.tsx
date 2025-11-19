import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { ArrowLeft, Loader2, Briefcase, Eye, EyeOff } from 'lucide-react';

export function ExpertLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsExpert } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Return URL for redirect after login
  const returnUrl = (location.state as any)?.from || '/expert/dashboard';

  // Demo credentials helper
  const fillDemoCredentials = () => {
    setEmail('expert@demo.com');
    setPassword('demo123');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check for demo credentials
      const isDemoExpert = email === 'expert@demo.com' && password === 'demo123';

      if (isDemoExpert) {
        // Demo Expert login
        const demoToken = 'demo-expert-token';
        const demoUserId = 'demo-expert-user-id';
        await loginAsExpert(demoToken, demoUserId);
        navigate(returnUrl, { replace: true });
        return;
      }

      // Real authentication with Supabase
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

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

      if (userRole !== 'expert') {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold mb-2">Expert Login</h1>
          <p className="text-center text-gray-600">
            Login untuk mengakses Dashboard Expert
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Demo Mode:</strong> Gunakan kredensial demo untuk testing
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fillDemoCredentials}
            className="w-full"
          >
            Isi Kredensial Demo
          </Button>
          <p className="text-xs text-blue-600 mt-2">
            expert@demo.com / demo123
          </p>
        </div>

        {/* Info untuk registrasi Expert */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Info:</strong> Akun Expert didaftarkan oleh administrator. Jika Anda belum memiliki akun, silakan hubungi tim kami.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 mr-2" />
                Login sebagai Expert
              </>
            )}
          </Button>
        </form>

        {/* Link ke User Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Bukan Expert?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:underline font-medium"
            >
              Login sebagai User
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
