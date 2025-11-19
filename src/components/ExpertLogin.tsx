import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Award, Mail, Lock, ArrowLeft, UserCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

type ExpertLoginProps = {
  onLoginSuccess: (accessToken: string, expertId: string) => void;
  onBack: () => void;
};

// Demo mode disabled - using real Supabase auth
const DEMO_MODE = false;

export function ExpertLogin({ onLoginSuccess, onBack }: ExpertLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="mb-2">Login Expert</h1>
            <p className="text-gray-600">
              Masuk untuk mengelola profil dan konsultasi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

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
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          {/* Info untuk registrasi */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Belum punya akun expert?</strong><br />
              Hubungi admin untuk mendaftar sebagai expert di platform kami.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}