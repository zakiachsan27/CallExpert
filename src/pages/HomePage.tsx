import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpertList } from '../components/ExpertList';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, LogOut, User, Briefcase } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { isUserLoggedIn, isExpertLoggedIn, logoutUser, logoutExpert } = useAuth();

  const handleExpertClick = (expertId: string) => {
    navigate(`/expert/${expertId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SK</span>
              </div>
              <div>
                <h1 className="font-bold text-xl">SobatKarir</h1>
                <p className="text-xs text-gray-600">Call Expert</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isUserLoggedIn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/user/transactions')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Riwayat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logoutUser}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}

              {isExpertLoggedIn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/expert/dashboard')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logoutExpert}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}

              {!isUserLoggedIn && !isExpertLoggedIn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/register')}
                  >
                    Daftar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Konsultasi dengan Expert
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Dapatkan bimbingan karir dari profesional berpengalaman
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => {
                const expertListSection = document.getElementById('expert-list');
                expertListSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Lihat Expert
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expert List */}
      <div id="expert-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ExpertList onExpertClick={handleExpertClick} />
      </div>
    </div>
  );
}