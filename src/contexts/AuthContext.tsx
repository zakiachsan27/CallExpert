import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { getExpertByUserId, createUser } from '../services/database';

type AuthContextType = {
  userAccessToken: string | null;
  expertAccessToken: string | null;
  userId: string | null;
  expertId: string | null;
  userName: string | null;
  isUserLoggedIn: boolean;
  isExpertLoggedIn: boolean;
  loginAsUser: (token: string, userId: string) => Promise<void>;
  loginAsExpert: (token: string, userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  logoutExpert: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [expertAccessToken, setExpertAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from Supabase session on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        const user = session.user;
        const token = session.access_token;

        // Check if user is an expert
        const expert = await getExpertByUserId(user.id);

        if (expert) {
          // User is an expert
          setExpertAccessToken(token);
          setUserId(user.id);
          setExpertId(expert.id);
          localStorage.setItem('expert_access_token', token);
          localStorage.setItem('expert_id', expert.id);
          localStorage.setItem('user_id', user.id);
        } else {
          // Regular user
          const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          setUserAccessToken(token);
          setUserId(user.id);
          setUserName(name);
          localStorage.setItem('user_access_token', token);
          localStorage.setItem('user_id', user.id);
          localStorage.setItem('user_name', name);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsUser = async (token: string, authUserId: string) => {
    try {
      setUserAccessToken(token);
      setUserId(authUserId);
      localStorage.setItem('user_access_token', token);
      localStorage.setItem('user_id', authUserId);

      // Ensure user exists in users table
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        localStorage.setItem('user_name', name);
        await createUser({
          id: user.id,
          email: user.email || '',
          name
        });
      }
    } catch (error) {
      console.error('Error in loginAsUser:', error);
      throw error;
    }
  };

  const loginAsExpert = async (token: string, authUserId: string) => {
    try {
      // Check if this is demo mode
      const isDemoMode = token === 'demo-expert-token' && authUserId === 'demo-expert-user-id';

      if (isDemoMode) {
        // Demo mode - set states without database verification
        setExpertAccessToken(token);
        setUserId(authUserId);
        setExpertId('demo-expert-id');
        localStorage.setItem('expert_access_token', token);
        localStorage.setItem('user_id', authUserId);
        localStorage.setItem('expert_id', 'demo-expert-id');
        return;
      }

      // Real mode - verify this user is actually an expert
      const expert = await getExpertByUserId(authUserId);

      if (!expert) {
        throw new Error('User is not registered as an expert');
      }

      setExpertAccessToken(token);
      setUserId(authUserId);
      setExpertId(expert.id);
      localStorage.setItem('expert_access_token', token);
      localStorage.setItem('user_id', authUserId);
      localStorage.setItem('expert_id', expert.id);
    } catch (error) {
      console.error('Error in loginAsExpert:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
      setUserAccessToken(null);
      setUserId(null);
      setUserName(null);
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
    } catch (error) {
      console.error('Error in logoutUser:', error);
    }
  };

  const logoutExpert = async () => {
    try {
      await supabase.auth.signOut();
      setExpertAccessToken(null);
      setUserId(null);
      setExpertId(null);
      localStorage.removeItem('expert_access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('expert_id');
    } catch (error) {
      console.error('Error in logoutExpert:', error);
    }
  };

  const value = {
    userAccessToken,
    expertAccessToken,
    userId,
    expertId,
    userName,
    isUserLoggedIn: !!userAccessToken,
    isExpertLoggedIn: !!expertAccessToken,
    loginAsUser,
    loginAsExpert,
    logoutUser,
    logoutExpert,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}