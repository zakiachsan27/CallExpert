import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { UserCircle, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

type UserLoginProps = {
  onLoginSuccess: (accessToken: string, userId: string) => void;
  onBack: () => void;
};

export function UserLogin({ onLoginSuccess, onBack }: UserLoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use Supabase Auth
      if (isLogin) {
        // Login using Supabase Auth REST API
        console.log('Attempting login for:', email);
        const response = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', { ok: response.ok, data });

        if (!response.ok) {
          setError(data.error_description || data.message || 'Login failed');
          setIsLoading(false);
          return;
        }

        if (data.access_token && data.user?.id) {
          console.log('Login successful for user:', data.user.id);
          onLoginSuccess(data.access_token, data.user.id);
        }
      } else {
        // Signup - use Supabase Auth directly
        console.log('Attempting signup for:', email, name);
        
        const response = await fetch(`https://${projectId}.supabase.co/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ 
            email, 
            password,
            data: {
              name: name
            }
          })
        });

        const result = await response.json();
        console.log('Signup response:', { ok: response.ok, result });

        if (!response.ok) {
          setError(result.error_description || result.message || 'Signup failed');
          setIsLoading(false);
          return;
        }

        // After signup, login automatically
        console.log('Signup successful, attempting auto-login');
        const loginResponse = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        console.log('Auto-login response:', { ok: loginResponse.ok, loginData });

        if (!loginResponse.ok) {
          setError(loginData.error_description || loginData.message || 'Login after signup failed');
          setIsLoading(false);
          return;
        }

        if (loginData.access_token && loginData.user?.id) {
          console.log('Auto-login successful for user:', loginData.user.id);
          onLoginSuccess(loginData.access_token, loginData.user.id);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="mb-2">
              {isLogin ? 'Login User' : 'Daftar User'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Masuk untuk melanjutkan konsultasi dengan expert'
                : 'Buat akun baru untuk memulai konsultasi'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative mt-1">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : (isLogin ? 'Login' : 'Daftar')}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
              atau
            </span>
          </div>

          {/* Toggle Login/Signup */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Daftar Sekarang' : 'Login'}
            </Button>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Dengan melanjutkan, Anda menyetujui{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}dan{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}