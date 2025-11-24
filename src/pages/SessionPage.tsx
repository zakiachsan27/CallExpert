import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ChatWindow } from '../components/ChatWindow';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { getBookingById, getExpertById } from '../services/database';
import type { Expert } from '../App';

export function SessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, expertId } = useAuth();

  const bookingId = searchParams.get('bookingId');

  // State
  const [booking, setBooking] = useState<any>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const { initializeChat, activeSession, isLoading: isChatLoading } = useChatContext();

  // Load booking and verify access
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        if (!bookingId) {
          setAuthError('ID Sesi tidak ditemukan');
          setIsLoading(false);
          return;
        }

        if (!userId && !expertId) {
          setAuthError('Anda harus login untuk mengakses sesi ini');
          setIsLoading(false);
          return;
        }

        // Verify user has access to this booking
        const bookingData = await getBookingById(bookingId);
        if (!bookingData) {
          setAuthError('Booking tidak ditemukan');
          setIsLoading(false);
          return;
        }

        // Check if user is owner or expert of this booking
        const isOwner = bookingData.user_id === userId;
        const isExpert = bookingData.expert_id === expertId;

        if (!isOwner && !isExpert) {
          setAuthError('Anda tidak memiliki akses ke sesi ini');
          setIsLoading(false);
          return;
        }

        setBooking(bookingData);

        // Load expert data
        if (bookingData.expert_id) {
          try {
            const expertData = await getExpertById(bookingData.expert_id);
            setExpert(expertData);
          } catch (err) {
            console.warn('Could not load expert data:', err);
          }
        }

        // Initialize chat context with session duration from booking
        await initializeChat(bookingId, bookingData.session_type?.duration || 60);

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading session data:', err);
        setAuthError(err instanceof Error ? err.message : 'Gagal memuat data sesi');
        setIsLoading(false);
      }
    };

    loadSessionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, userId, expertId]);

  if (isLoading || isChatLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat sesi...</p>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
              <p className="text-sm text-gray-600 mb-4">{authError}</p>
              <Button onClick={() => navigate(-1)} className="w-full">
                Kembali
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  if (expertId) {
                    navigate('/expert/dashboard/transaksi');
                  } else {
                    navigate('/transactions');
                  }
                }}
                className="relative z-10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sesi Konsultasi</h1>
                <p className="text-sm text-gray-500">ID: {bookingId?.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Window - 2/3 width */}
          <div className="lg:col-span-2">
            <ChatWindow
              expertName={expert?.name || 'Expert'}
              userName={userData?.name || 'User'}
            />
          </div>

          {/* Session Info Sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Session Details */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Detail Sesi</h3>

              {activeSession && (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-gray-900 capitalize">{activeSession.status}</p>
                  </div>

                  {activeSession.user_joined_at && (
                    <div>
                      <p className="text-gray-500">User Bergabung</p>
                      <p className="font-medium text-gray-900">
                        {new Date(activeSession.user_joined_at).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  )}

                  {activeSession.expert_joined_at && (
                    <div>
                      <p className="text-gray-500">Expert Bergabung</p>
                      <p className="font-medium text-gray-900">
                        {new Date(activeSession.expert_joined_at).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  )}

                  {activeSession.ended_at && (
                    <div>
                      <p className="text-gray-500">Sesi Berakhir</p>
                      <p className="font-medium text-gray-900">
                        {new Date(activeSession.ended_at).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Expert Info */}
            {expert && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Profil Expert</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <img
                      src={expert.avatar}
                      alt={expert.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expert.name}</p>
                      <p className="text-gray-500 text-xs">{expert.role}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-gray-500">Pengalaman</p>
                    <p className="font-medium text-gray-900">{expert.experience}+ tahun</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Help */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Tips Sesi</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Pastikan koneksi internet stabil</li>
                <li>✓ Tulis pertanyaan Anda dengan jelas</li>
                <li>✓ Respek waktu sesi yang dialokasikan</li>
                <li>✓ Simpan informasi penting dari chat</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
