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

// Demo mode for development
const DEMO_MODE = true;
const DEMO_EXPERTS = [
  { email: 'expert@demo.com', password: 'demo123', id: 'demo-expert-1', name: 'Demo Expert' }
];

export function ExpertLogin({ onLoginSuccess, onBack }: ExpertLoginProps) {
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
      // Demo mode fallback
      if (DEMO_MODE) {
        console.log('Running in DEMO mode (Expert)');
        
        if (isLogin) {
          // Check demo credentials
          const demoExpert = DEMO_EXPERTS.find(u => u.email === email && u.password === password);
          if (demoExpert) {
            console.log('Demo expert login successful');
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 500));
            onLoginSuccess(`demo-token-${demoExpert.id}`, demoExpert.id);
            return;
          } else {
            setError('Email atau password salah. Coba: expert@demo.com / demo123');
            setIsLoading(false);
            return;
          }
        } else {
          // Demo signup - just create a new demo expert
          console.log('Demo expert signup successful');
          await new Promise(resolve => setTimeout(resolve, 500));
          const newExpertId = `demo-expert-${Date.now()}`;
          onLoginSuccess(`demo-token-${newExpertId}`, newExpertId);
          return;
        }
      }

      // Production mode - use Supabase
      if (isLogin) {
        // Login using Supabase Auth REST API
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
      } else {
        // Signup - call our custom endpoint
        console.log('Attempting expert signup for:', email, name);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ email, password, name })
          }
        );

        const result = await response.json();
        console.log('Expert signup response:', { ok: response.ok, result });

        if (!response.ok) {
          setError(result.error || 'Signup failed');
          setIsLoading(false);
          return;
        }

        // After signup, login automatically
        console.log('Expert signup successful, attempting auto-login');
        const loginResponse = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        console.log('Expert auto-login response:', { ok: loginResponse.ok, loginData });

        if (!loginResponse.ok) {
          setError(loginData.error_description || loginData.message || 'Login after signup failed');
          setIsLoading(false);
          return;
        }

        if (loginData.access_token && loginData.user?.id) {
          console.log('Expert auto-login successful for user:', loginData.user.id);
          onLoginSuccess(loginData.access_token, loginData.user.id);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      
      // Fallback to demo mode on error
      if (isLogin) {
        setError('Server tidak tersedia. Gunakan kredensial demo: expert@demo.com / demo123');
      } else {
        setError('Server tidak tersedia. Mode demo akan segera aktif.');
      }
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
          {/* Demo Mode Notice */}
          {DEMO_MODE && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-purple-900 mb-1">Mode Demo Aktif</p>
                  <p className="text-purple-700 text-sm">
                    Gunakan kredensial berikut untuk login:
                  </p>
                  <div className="bg-white rounded mt-2 p-2 text-sm font-mono">
                    <div>Email: <span className="text-purple-600">expert@demo.com</span></div>
                    <div>Password: <span className="text-purple-600">demo123</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="mb-2">
              {isLogin ? 'Login Expert' : 'Daftar Expert'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Masuk untuk mengelola profil dan konsultasi'
                : 'Bergabunglah sebagai expert dan mulai berbagi pengalaman'
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
              className="w-full bg-purple-600 hover:bg-purple-700" 
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
              {isLogin ? 'Belum terdaftar sebagai expert?' : 'Sudah punya akun?'}
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Daftar Sebagai Expert' : 'Login'}
            </Button>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Dengan melanjutkan, Anda menyetujui{' '}
            <a href="#" className="text-purple-600 hover:underline">Terms of Service</a>
            {' '}dan{' '}
            <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}