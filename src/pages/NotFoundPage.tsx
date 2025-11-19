import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mt-4">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
