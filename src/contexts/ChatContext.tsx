import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  sendMessage as dbSendMessage,
  getSessionMessages,
  getActiveSession,
  startSession as dbStartSession,
  subscribeToMessages,
  subscribeToSessionStatus,
  ChatMessage,
  ActiveSession,
  endSession as dbEndSession
} from '../services/database';
import { useAuth } from './AuthContext';

interface ChatContextType {
  // State
  messages: ChatMessage[];
  activeSession: ActiveSession | null;
  isLoading: boolean;
  error: string | null;

  // Derived state
  sessionDurationMinutes: number | null;
  timeRemainingSeconds: number | null;
  isSessionActive: boolean;
  canChat: boolean;

  // Actions
  sendMessage: (text: string) => Promise<void>;
  startSession: () => Promise<void>;
  endSession: (endedBy: 'user' | 'expert' | 'timeout') => Promise<void>;
  initializeChat: (bookingId: string, durationMinutes?: number) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { userId, expertId } = useAuth();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session tracking
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  // Subscriptions
  const [messageChannel, setMessageChannel] = useState<any>(null);
  const [sessionChannel, setSessionChannel] = useState<any>(null);

  // Timer logic - countdown for session duration
  useEffect(() => {
    if (!activeSession?.ended_at && activeSession?.status === 'active' && sessionDurationMinutes) {
      const sessionStartTime = activeSession.expert_joined_at || activeSession.user_joined_at;
      if (sessionStartTime) {
        const interval = setInterval(() => {
          const now = new Date();
          const startTime = new Date(sessionStartTime);
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const totalSeconds = sessionDurationMinutes * 60;
          const remaining = Math.max(0, totalSeconds - elapsedSeconds);

          setTimeRemainingSeconds(remaining);

          // Auto-end session if time is up
          if (remaining === 0 && currentBookingId) {
            dbEndSession(currentBookingId, 'timeout').catch(err => {
              console.error('Failed to auto-end session:', err);
            });
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [activeSession?.status, activeSession?.ended_at, activeSession?.expert_joined_at, activeSession?.user_joined_at, sessionDurationMinutes, currentBookingId]);

  // Initialize chat for a booking
  const initializeChat = async (bookingId: string, durationMinutes?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentBookingId(bookingId);

      if (durationMinutes) {
        setSessionDurationMinutes(durationMinutes);
      }

      // Start or join session
      try {
        const userType = expertId ? 'expert' : 'user';
        const session = await dbStartSession(bookingId, userType);
        setActiveSession(session);

        // Calculate time remaining based on session state
        if (session && durationMinutes) {
          if (session.status === 'ended' || session.ended_at) {
            // Session already ended - time remaining is 0
            setTimeRemainingSeconds(0);
          } else if (session.status === 'active') {
            // Session is active - calculate remaining time from start
            const sessionStartTime = session.expert_joined_at || session.user_joined_at;
            if (sessionStartTime) {
              const now = new Date();
              const startTime = new Date(sessionStartTime);
              const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
              const totalSeconds = durationMinutes * 60;
              const remaining = Math.max(0, totalSeconds - elapsedSeconds);
              setTimeRemainingSeconds(remaining);

              // If already expired, end the session
              if (remaining === 0) {
                dbEndSession(bookingId, 'timeout').catch(err => {
                  console.error('Failed to auto-end expired session:', err);
                });
              }
            } else {
              setTimeRemainingSeconds(durationMinutes * 60);
            }
          } else {
            // Session not started yet - full time
            setTimeRemainingSeconds(durationMinutes * 60);
          }
        }
      } catch (startErr) {
        console.warn('Could not start session:', startErr);
        // Set full time if we couldn't get session state
        if (durationMinutes) {
          setTimeRemainingSeconds(durationMinutes * 60);
        }
      }

      // Fetch existing messages with error handling
      try {
        const fetchedMessages = await getSessionMessages(bookingId);
        setMessages(fetchedMessages);
      } catch (msgErr) {
        console.warn('Could not fetch messages (tables may not be created yet):', msgErr);
        setMessages([]);
      }

      // Subscribe to new messages
      try {
        // console.log('📡 Setting up message subscription for booking:', bookingId);
        const msgChannel = subscribeToMessages(bookingId, (newMessage) => {
          // console.log('📩 ChatContext received new message:', newMessage);
          setMessages((prev) => {
            // console.log('📩 Current messages count:', prev.length);
            // Remove optimistic message if it exists
            const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
            // Add real message only if it doesn't exist
            const exists = withoutTemp.find(m => m.id === newMessage.id);
            if (exists) {
              // console.log('📩 Message already exists, skipping');
              return withoutTemp;
            }
            // console.log('📩 Adding new message to state');
            return [...withoutTemp, newMessage];
          });
        });
        setMessageChannel(msgChannel);
        // console.log('📡 Message channel created and stored');
      } catch (subErr) {
        console.error('❌ Could not subscribe to messages:', subErr);
      }

      // Subscribe to session status changes
      try {
        const sessChannel = subscribeToSessionStatus(bookingId, (updatedSession) => {
          setActiveSession(updatedSession);
        });
        setSessionChannel(sessChannel);
      } catch (subErr) {
        console.warn('Could not subscribe to session status:', subErr);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize chat');
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async (text: string) => {
    if (!currentBookingId || !userId) {
      setError('Not properly initialized for chat');
      return;
    }

    try {
      const senderType = expertId ? 'expert' : 'user';
      const senderId = expertId || userId;

      // Optimistic UI update
      const optimisticMessage: ChatMessage = {
        id: 'temp-' + Date.now(),
        booking_id: currentBookingId,
        sender_id: senderId,
        sender_type: senderType,
        message_text: text,
        is_edited: false,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send to database
      await dbSendMessage(currentBookingId, senderId, senderType, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    }
  };

  // Start session (for both user and expert)
  const startSession = async () => {
    if (!currentBookingId) {
      setError('No active booking');
      return;
    }

    try {
      const userType = expertId ? 'expert' : 'user';
      // Note: startSession function in database service handles the logic
      // We're just triggering the update, subscription will handle state update
      const senderType = expertId ? 'expert' : 'user';
      const senderId = expertId || userId;

      if (!senderId) throw new Error('User not authenticated');

      // This would typically be called from the session page
      // For now, we're keeping it simple - the actual implementation
      // would use a backend function to properly start the session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  };

  // End session
  const endSession = async (endedBy: 'user' | 'expert' | 'timeout') => {
    if (!currentBookingId) {
      setError('No active booking');
      return;
    }

    try {
      // Call database function to end session
      await dbEndSession(currentBookingId, endedBy);
      
      // Update local state
      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'ended',
              ended_at: new Date().toISOString(),
              ended_by: endedBy
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  // Clear chat state
  const clearChat = () => {
    setMessages([]);
    setActiveSession(null);
    setError(null);
    setCurrentBookingId(null);
    setSessionDurationMinutes(null);
    setTimeRemainingSeconds(null);

    if (messageChannel) {
      messageChannel.unsubscribe();
      setMessageChannel(null);
    }
    if (sessionChannel) {
      sessionChannel.unsubscribe();
      setSessionChannel(null);
    }
  };

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (messageChannel) messageChannel.unsubscribe();
      if (sessionChannel) sessionChannel.unsubscribe();
    };
  }, [messageChannel, sessionChannel]);

  const contextValue: ChatContextType = {
    messages,
    activeSession,
    isLoading,
    error,
    sessionDurationMinutes,
    timeRemainingSeconds,
    isSessionActive: activeSession?.status === 'active',
    canChat: activeSession?.status === 'active' || activeSession?.status === 'waiting_expert',
    sendMessage,
    startSession,
    endSession,
    initializeChat,
    clearChat
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
