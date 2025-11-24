import { useState, useEffect, useRef } from 'react';
import { Send, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface ChatWindowProps {
  expertName: string;
  userName: string;
}

export function ChatWindow({ expertName, userName }: ChatWindowProps) {
  const { userId, expertId } = useAuth();
  const {
    messages,
    activeSession,
    isSessionActive,
    canChat,
    timeRemainingSeconds,
    sessionDurationMinutes,
    sendMessage,
    endSession,
    error
  } = useChatContext();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !canChat) return;

    setIsSending(true);
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Anda yakin ingin mengakhiri sesi? Sesi tidak bisa dilanjutkan lagi.')) {
      endSession(expertId ? 'expert' : 'user');
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const currentUserName = expertId ? expertName : userName;
  const otherUserName = expertId ? userName : expertName;

  return (
    <Card className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Sesi Konsultasi Chat</h3>
            <p className="text-sm text-gray-500">dengan {otherUserName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{formatTime(timeRemainingSeconds)}</div>
              {sessionDurationMinutes && <div className="text-xs text-gray-500">dari {sessionDurationMinutes} min</div>}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {activeSession?.status === 'active' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Aktif</span>
              </>
            ) : activeSession?.status === 'waiting_expert' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs text-yellow-600 font-medium">Menunggu Expert</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-red-600 font-medium">Berakhir</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 mx-4 mt-4 rounded-lg flex items-gap gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
            return (
              <div key={msg.id} className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isSentByCurrentUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words">{msg.message_text}</p>
                  <p className={`text-xs mt-1 ${isSentByCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning when time is running out */}
      {timeRemainingSeconds !== null && timeRemainingSeconds < 300 && timeRemainingSeconds > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 mx-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-600">Waktu sesi tinggal {Math.floor(timeRemainingSeconds / 60)} menit lagi</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4 bg-white space-y-3">
        {activeSession?.status === 'ended' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">Sesi telah berakhir. {activeSession.ended_by === 'timeout' ? 'Durasi telah habis.' : 'Sesi ditutup.'}</p>
          </div>
        )}

        {canChat ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Ketik pesan Anda..."
              disabled={isSending || !isSessionActive}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <Button
              type="submit"
              disabled={isSending || !messageInput.trim() || !isSessionActive}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : null}

        {activeSession?.status !== 'ended' && (
          <Button
            onClick={handleEndSession}
            variant="destructive"
            className="w-full"
          >
            Akhiri Sesi Konsultasi
          </Button>
        )}
      </div>
    </Card>
  );
}
