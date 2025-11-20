import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { ArrowLeft, Loader2, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

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
              <span className="text-white font-bold text-xl">SK</span>
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold mb-2">Daftar SobatKarir</h1>
          <p className="text-center text-gray-600">
            Buat akun untuk melanjutkan
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-green-800 font-medium">Registrasi berhasil!</p>
              <p className="text-xs text-green-600">Mengalihkan ke halaman login...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

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
            <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || success}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Daftar'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:underline font-medium"
            >
              Login sekarang
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}