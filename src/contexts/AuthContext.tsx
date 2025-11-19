import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

type AuthContextType = {
  userAccessToken: string | null;
  expertAccessToken: string | null;
  isUserLoggedIn: boolean;
  isExpertLoggedIn: boolean;
  loginAsUser: (token: string) => void;
  loginAsExpert: (token: string) => void;
  logoutUser: () => void;
  logoutExpert: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [expertAccessToken, setExpertAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const savedUserToken = localStorage.getItem('user_access_token');
    const savedExpertToken = localStorage.getItem('expert_access_token');

    if (savedUserToken) {
      // Verify token is still valid
      verifyToken(savedUserToken, 'user').then(isValid => {
        if (isValid) {
          setUserAccessToken(savedUserToken);
        } else {
          localStorage.removeItem('user_access_token');
        }
      });
    }

    if (savedExpertToken) {
      // Verify token is still valid
      verifyToken(savedExpertToken, 'expert').then(isValid => {
        if (isValid) {
          setExpertAccessToken(savedExpertToken);
        } else {
          localStorage.removeItem('expert_access_token');
        }
      });
    }

    setIsLoading(false);
  }, []);

  const verifyToken = async (token: string, role: 'user' | 'expert'): Promise<boolean> => {
    try {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  const loginAsUser = (token: string) => {
    setUserAccessToken(token);
    localStorage.setItem('user_access_token', token);
  };

  const loginAsExpert = (token: string) => {
    setExpertAccessToken(token);
    localStorage.setItem('expert_access_token', token);
  };

  const logoutUser = () => {
    setUserAccessToken(null);
    localStorage.removeItem('user_access_token');
  };

  const logoutExpert = () => {
    setExpertAccessToken(null);
    localStorage.removeItem('expert_access_token');
  };

  const value = {
    userAccessToken,
    expertAccessToken,
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