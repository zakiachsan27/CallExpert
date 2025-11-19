import { useNavigate } from 'react-router-dom';
import { UserTransactionHistory } from '../components/UserTransactionHistory';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function UserTransactionsPage() {
  const navigate = useNavigate();
  const { userAccessToken } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <h1 className="font-bold text-xl">Riwayat Transaksi</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserTransactionHistory 
          accessToken={userAccessToken || 'demo-user-token'} 
          onBack={() => navigate('/')} 
        />
      </div>
    </div>
  );
}
