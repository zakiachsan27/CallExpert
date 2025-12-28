import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Briefcase, Menu, X } from 'lucide-react';
import { useState } from 'react';

type HeaderProps = {
  transparent?: boolean;
};

export function Header({ transparent = false }: HeaderProps) {
  const navigate = useNavigate();
  const { isUserLoggedIn, isExpertLoggedIn, userName, logoutUser, logoutExpert } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 ${transparent ? 'bg-white/80 backdrop-blur-md' : 'bg-white'} border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-brand-600 tracking-tight hover:text-brand-700 transition">
            MentorinAja
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
            <button
              onClick={() => navigate('/experts')}
              className="hover:text-brand-600 transition"
            >
              Cari Mentor
            </button>
            <button
              onClick={() => scrollToSection('testi')}
              className="hover:text-brand-600 transition"
            >
              Cerita User
            </button>
            <button
              onClick={() => scrollToSection('cara-booking')}
              className="hover:text-brand-600 transition"
            >
              Cara Kerja
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {isUserLoggedIn && (
            <>
              <span className="text-sm font-medium text-gray-700">
                Halo, <span className="text-brand-600 font-semibold">{userName}</span>
              </span>
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
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition"
              >
                Login
              </button>
              <Button
                size="sm"
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition transform hover:-translate-y-0.5"
                onClick={() => navigate('/register')}
              >
                Daftar Gratis
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <button
            onClick={() => { navigate('/experts'); setMobileMenuOpen(false); }}
            className="block w-full text-left text-gray-600 hover:text-brand-600 py-2"
          >
            Cari Mentor
          </button>
          <button
            onClick={() => scrollToSection('testi')}
            className="block w-full text-left text-gray-600 hover:text-brand-600 py-2"
          >
            Cerita User
          </button>
          <button
            onClick={() => scrollToSection('cara-booking')}
            className="block w-full text-left text-gray-600 hover:text-brand-600 py-2"
          >
            Cara Kerja
          </button>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            {isUserLoggedIn && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { navigate('/user/transactions'); setMobileMenuOpen(false); }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Riwayat
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { logoutUser(); setMobileMenuOpen(false); }}
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
                  className="w-full justify-start"
                  onClick={() => { navigate('/expert/dashboard'); setMobileMenuOpen(false); }}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { logoutExpert(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}

            {!isUserLoggedIn && !isExpertLoggedIn && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 transition"
                >
                  Daftar Gratis
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
