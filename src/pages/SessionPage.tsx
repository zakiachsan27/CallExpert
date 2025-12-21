import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Paperclip, Clock, MoreVertical,
  CheckCheck, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { getBookingById, getExpertById } from '../services/database';
import type { Expert } from '../App';

export function SessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, expertId } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const bookingId = searchParams.get('bookingId');

  // State
  const [booking, setBooking] = useState<any>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const {
    initializeChat,
    activeSession,
    isLoading: isChatLoading,
    messages,
    sendMessage,
    endSession,
    timeRemainingSeconds,
    sessionDurationMinutes,
    isSessionActive,
    canChat
  } = useChatContext();

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

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Format timer
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Kirim Pesan
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canChat || timeRemainingSeconds === 0) return;

    setIsSending(true);
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle End Session
  const handleEndSession = () => {
    if (window.confirm('Anda yakin ingin mengakhiri sesi? Sesi tidak bisa dilanjutkan lagi.')) {
      endSession(expertId ? 'expert' : 'user');
    }
  };

  // Check if session is expired
  const isSessionExpired = timeRemainingSeconds === 0 || activeSession?.status === 'ended';

  // Get session status badge
  const getSessionBadge = () => {
    if (isSessionExpired) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 px-2 py-0.5 text-[10px]">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span> BERAKHIR
        </Badge>
      );
    }
    if (activeSession?.status === 'waiting_expert') {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 px-2 py-0.5 text-[10px]">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse mr-1"></span> MENUNGGU
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-2 py-0.5 text-[10px]">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span> LIVE
      </Badge>
    );
  };

  // Timer color based on remaining time
  const getTimerColor = () => {
    if (isSessionExpired) return 'bg-red-50 text-red-600 border-red-100';
    if (timeRemainingSeconds !== null && timeRemainingSeconds < 300) return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-brand-50 text-brand-600 border-brand-100';
  };

  if (isLoading || isChatLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-gray-600">Memuat sesi...</p>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
              <p className="text-sm text-gray-600 mb-4">{authError}</p>
              <Button onClick={() => navigate(-1)} className="w-full bg-brand-600 hover:bg-brand-700">
                Kembali
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const expertName = expert?.name || 'Expert';
  const expertRole = expert?.role || 'Mentor';
  const expertAvatar = expert?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${expertName}`;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">

      {/* 1. Navbar Simple */}
      <header className="bg-white border-b border-gray-200 h-16 flex-none flex items-center shadow-sm z-20 px-4">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (expertId) {
                  navigate('/expert/dashboard');
                } else {
                  navigate('/transactions');
                }
              }}
              className="text-gray-500 hover:text-brand-600 transition flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-5 h-5" /> Kembali
            </button>
            <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden sm:block"></div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Sesi Konsultasi #{bookingId?.substring(0, 6).toUpperCase()}
                {getSessionBadge()}
              </h1>
            </div>
          </div>
          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="lg:hidden text-gray-500">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 2. Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-64px)] overflow-hidden">

        {/* LEFT: Chat Interface */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">

          {/* Chat Header */}
          <div className="h-16 border-b border-gray-100 flex justify-between items-center px-4 sm:px-6 bg-white z-10 flex-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarImage src={expertAvatar} />
                  <AvatarFallback>{expertName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {!isSessionExpired && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{expertName}</h3>
                <p className="text-xs text-brand-600 font-medium">Expert • {expertRole}</p>
              </div>
            </div>
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getTimerColor()}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-bold font-mono">
                {isSessionExpired ? 'Berakhir' : formatTime(timeRemainingSeconds)}
              </span>
            </div>
          </div>

          {/* Chat Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50"
            style={{
              backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-sm">Belum ada pesan</div>
                  <div className="text-xs mt-2">Mulai percakapan Anda sekarang</div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSentByCurrentUser = msg.sender_id === userId || msg.sender_id === expertId;
                const isMe = isSentByCurrentUser;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <Avatar className="h-8 w-8 self-end border border-gray-200 bg-white hidden sm:block">
                        <AvatarImage src={expertAvatar} />
                        <AvatarFallback>{expertName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-500 mx-1">
                        {isMe ? 'Anda' : expertName}
                      </span>
                      <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-slate-800 rounded-bl-none'
                      }`}>
                        {msg.message_text}
                      </div>
                      <div className="flex items-center gap-1 mx-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isMe && (
                          <CheckCheck className="w-3 h-3 text-brand-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Session Ended Message */}
          {isSessionExpired && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  {activeSession?.status === 'ended'
                    ? (activeSession.ended_by === 'timeout' ? 'Sesi telah berakhir. Durasi waktu telah habis.' : 'Sesi telah berakhir.')
                    : 'Waktu sesi telah habis. Chat sudah tidak aktif.'}
                </p>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!isSessionExpired && canChat && (
            <div className="p-4 bg-white border-t border-gray-100 flex-none">
              <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-400 transition">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 h-10 w-10 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </Button>

                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ketik pesanmu di sini..."
                  disabled={isSending || !isSessionActive}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 resize-none py-2.5 max-h-32 min-h-[40px] outline-none disabled:opacity-50"
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !inputValue.trim() || !isSessionActive}
                  className="bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md h-10 w-10 p-0 flex items-center justify-center transition transform active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </div>
              <p className="hidden sm:block text-[10px] text-gray-400 mt-2 text-center">
                Tekan Enter untuk mengirim. Shift + Enter untuk baris baru.
              </p>
            </div>
          )}

          {/* End Session Button (when session is active) */}
          {!isSessionExpired && (
            <div className="p-4 pt-0 bg-white">
              <Button
                onClick={handleEndSession}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-10 text-sm font-medium"
              >
                <XCircle className="w-4 h-4 mr-2" /> Akhiri Sesi
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar Info (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 overflow-y-auto h-full pb-4 pr-1">

          {/* Card: Combined Expert & Session Info */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            {/* Expert Header */}
            {expert && (
              <div className="p-3 bg-gradient-to-r from-brand-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                    <AvatarImage src={expertAvatar} />
                    <AvatarFallback className="text-xs font-bold">{expertName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{expertName}</h3>
                    <p className="text-[11px] text-gray-500 truncate">{expertRole}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Details */}
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Status</span>
                {isSessionExpired ? (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 px-1.5 py-0 text-[10px] h-5">Berakhir</Badge>
                ) : activeSession?.status === 'waiting_expert' ? (
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 px-1.5 py-0 text-[10px] h-5">Menunggu</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-1.5 py-0 text-[10px] h-5">Aktif</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Durasi</span>
                <span className="text-xs font-semibold text-slate-900">{sessionDurationMinutes || 60} Menit</span>
              </div>
              {activeSession?.user_joined_at && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">User Join</span>
                  <span className="text-xs font-medium text-slate-700">
                    {new Date(activeSession.user_joined_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {activeSession?.expert_joined_at && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Expert Join</span>
                  <span className="text-xs font-medium text-slate-700">
                    {new Date(activeSession.expert_joined_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {activeSession?.ended_at && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Berakhir</span>
                  <span className="text-xs font-semibold text-red-600">
                    {new Date(activeSession.ended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Card: Tips */}
          <Card className="p-3 border-blue-100 bg-blue-50/50 shadow-none">
            <h4 className="text-[10px] font-bold text-blue-800 uppercase mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Tips Sesi
            </h4>
            <ul className="text-[11px] text-blue-700 space-y-1 list-disc pl-3.5 leading-relaxed">
              <li>Gunakan bahasa yang sopan</li>
              <li>Fokus pada topik konsultasi</li>
              <li>Dilarang transaksi di luar platform</li>
              <li>Jaga kerahasiaan data pribadi</li>
            </ul>
          </Card>

        </div>

      </main>
    </div>
  );
}
