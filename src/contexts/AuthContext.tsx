import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '../services/supabase';
import { getExpertByUserId, createUser } from '../services/database';
import { pushNotificationService } from '../services/pushNotifications';

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
  const isRestoringSession = useRef(false);

  // Helper function to persist session to Preferences (for native platforms)
  const persistSessionToPreferences = async (session: { access_token: string; refresh_token: string }) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      console.log('🔐 Persisting session to Preferences...');
      await Preferences.set({
        key: 'mentorinaja-auth',
        value: JSON.stringify(session)
      });
      console.log('🔐 Session persisted to Preferences successfully');
    } catch (error) {
      console.error('🔐 Error persisting session to Preferences:', error);
    }
  };

  // Initialize auth state from Supabase session on mount
  useEffect(() => {
    console.log('🔐 ====== AuthContext useEffect STARTING ======');
    initializeAuth();

    // Set up auth state change listener for session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 ====== onAuthStateChange ======');
      console.log('🔐 Event:', event);
      console.log('🔐 Session:', session ? `user=${session.user?.id}` : 'null');
      console.log('🔐 isRestoringSession.current:', isRestoringSession.current);

      // CRITICAL: Persist session to Preferences on ANY session event (except sign out)
      // This ensures session is saved even on TOKEN_REFRESHED events
      if (session && Capacitor.isNativePlatform()) {
        await persistSessionToPreferences(session);
      }

      // Handle session restoration (INITIAL_SESSION, TOKEN_REFRESHED only)
      // NOTE: Don't handle SIGNED_IN here - that's handled by loginAsUser/loginAsExpert
      // SIGNED_IN event fires on manual login, which we already handle in the login functions
      if ((event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session) {
        // Skip if we're already initializing to avoid duplicate calls
        if (isRestoringSession.current) return;
        isRestoringSession.current = true;

        try {
          await restoreSession(session);
        } finally {
          isRestoringSession.current = false;
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear all auth state on sign out
        setUserAccessToken(null);
        setExpertAccessToken(null);
        setUserId(null);
        setExpertId(null);
        setUserName(null);
        localStorage.removeItem('user_access_token');
        localStorage.removeItem('expert_access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('expert_id');
        localStorage.removeItem('user_name');

        // Also clear Preferences
        if (Capacitor.isNativePlatform()) {
          try {
            await Preferences.remove({ key: 'mentorinaja-auth' });
            await Preferences.remove({ key: 'mentorinaja-expert-info' });
            console.log('🔐 Session and expert info cleared from Preferences on sign out');
          } catch (e) {
            console.error('🔐 Error clearing Preferences:', e);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to restore session from Supabase session object
  const restoreSession = async (session: { user: { id: string; email?: string; user_metadata?: { name?: string } }; access_token: string }) => {
    const user = session.user;
    const token = session.access_token;

    console.log('🔐 ====== restoreSession CALLED ======');
    console.log('🔐 User ID:', user.id);
    console.log('🔐 Token length:', token?.length);

    try {
      // Check if user is an expert
      console.log('🔐 Checking if user is expert...');
      const expert = await getExpertByUserId(user.id);

      if (expert) {
        // User is an expert
        console.log('🔐 ✅ User IS expert:', expert.id);
        console.log('🔐 Setting expertAccessToken, userId, expertId...');
        setExpertAccessToken(token);
        setUserId(user.id);
        setExpertId(expert.id);
        localStorage.setItem('expert_access_token', token);
        localStorage.setItem('expert_id', expert.id);
        localStorage.setItem('user_id', user.id);
        console.log('🔐 ✅ Expert state SET - isExpertLoggedIn should be TRUE');
      } else {
        // Regular user
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        console.log('🔐 ✅ User is regular user:', name);
        setUserAccessToken(token);
        setUserId(user.id);
        setUserName(name);
        localStorage.setItem('user_access_token', token);
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', name);
        console.log('🔐 ✅ User state SET - isUserLoggedIn should be TRUE');
      }
    } catch (error) {
      console.error('🔐 ❌ ERROR in restoreSession:', error);
    }
  };

  const initializeAuth = async () => {
    console.log('🔐 ====== INITIALIZING AUTH ======');
    console.log('🔐 Platform:', Capacitor.getPlatform(), '| Native:', Capacitor.isNativePlatform());

    try {
      // For native apps, check Preferences first for expert info
      let storedExpertInfo: { expertId?: string; userId?: string } | null = null;
      let storedSession: string | null = null;

      if (Capacitor.isNativePlatform()) {
        try {
          // Check what's in Preferences
          const { value: sessionValue } = await Preferences.get({ key: 'mentorinaja-auth' });
          const { value: expertValue } = await Preferences.get({ key: 'mentorinaja-expert-info' });

          console.log('🔐 Preferences check:');
          console.log('   - mentorinaja-auth:', sessionValue ? `EXISTS (${sessionValue.length} chars)` : 'NOT FOUND');
          console.log('   - mentorinaja-expert-info:', expertValue ? 'EXISTS' : 'NOT FOUND');

          storedSession = sessionValue;
          if (expertValue) {
            storedExpertInfo = JSON.parse(expertValue);
            console.log('   - Expert info:', storedExpertInfo);
          }
        } catch (e) {
          console.error('🔐 Error reading from Preferences:', e);
        }
      }

      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔐 Supabase getSession result:');
      console.log('   - session:', session ? `EXISTS (user: ${session.user.id})` : 'NULL');
      console.log('   - error:', error ? error.message : 'NONE');

      if (error) throw error;

      if (session?.user) {
        isRestoringSession.current = true;
        try {
          await restoreSession(session);
        } finally {
          isRestoringSession.current = false;
        }
      } else if (Capacitor.isNativePlatform() && storedExpertInfo?.expertId && storedExpertInfo?.userId) {
        // Supabase session not found, but we have stored expert info
        // This might happen if session expired but user should still be "logged in"
        console.log('🔐 No Supabase session, but found stored expert info - attempting to refresh session');

        // Try to restore from Preferences
        try {
          const { value } = await Preferences.get({ key: 'mentorinaja-auth' });
          if (value) {
            const sessionData = JSON.parse(value);
            if (sessionData?.refresh_token) {
              console.log('🔐 Attempting to refresh session with stored refresh token...');
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                refresh_token: sessionData.refresh_token
              });

              if (refreshError) {
                console.error('🔐 Session refresh failed:', refreshError.message);
                // Clear stored data since session is invalid
                await Preferences.remove({ key: 'mentorinaja-auth' });
                await Preferences.remove({ key: 'mentorinaja-expert-info' });
              } else if (refreshData.session) {
                console.log('🔐 Session refreshed successfully!');
                // Session is now restored, restoreSession will be called by onAuthStateChange
              }
            }
          }
        } catch (restoreError) {
          console.error('🔐 Error restoring session from Preferences:', restoreError);
          // Clear invalid data
          await Preferences.remove({ key: 'mentorinaja-auth' });
          await Preferences.remove({ key: 'mentorinaja-expert-info' });
        }
      }
    } catch (error) {
      console.error('🔐 ❌ Auth initialization error:', error);
    } finally {
      setIsLoading(false);
      console.log('🔐 ====== initializeAuth COMPLETE ======');
      console.log('🔐 isLoading set to FALSE');
    }
  };

  const loginAsUser = async (token: string, authUserId: string) => {
    // Set auth state first - this is critical and should never fail
    setUserAccessToken(token);
    setUserId(authUserId);
    localStorage.setItem('user_access_token', token);
    localStorage.setItem('user_id', authUserId);

    try {
      // Try to get user info and create/update user record
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        localStorage.setItem('user_name', name);

        // createUser is now non-throwing, but wrap in try-catch just in case
        try {
          await createUser({
            id: user.id,
            email: user.email || '',
            name
          });
        } catch (createUserError) {
          // Log but don't fail login
          console.warn('Could not create/update user record:', createUserError);
        }
      }
    } catch (error) {
      // Log but don't fail login - user is already authenticated
      console.warn('Error getting user info:', error);
    }

    // Initialize push notifications (non-critical)
    try {
      if (pushNotificationService.isNativePlatform()) {
        await pushNotificationService.initialize();
      }
    } catch (pushError) {
      console.warn('Error initializing push notifications:', pushError);
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

      // CRITICAL: For native platforms, save BOTH session AND expert info to Preferences
      // This ensures we can restore even if onAuthStateChange doesn't complete
      if (Capacitor.isNativePlatform()) {
        try {
          // Get current session and save it
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await Preferences.set({
              key: 'mentorinaja-auth',
              value: JSON.stringify(session)
            });
            console.log('🔐 Session saved to Preferences in loginAsExpert');
          }

          // Also save expert info as fallback
          await Preferences.set({
            key: 'mentorinaja-expert-info',
            value: JSON.stringify({ expertId: expert.id, userId: authUserId })
          });
          console.log('🔐 Expert info saved to Preferences');

          // VERIFY: Read back to confirm save worked
          const { value: verifySession } = await Preferences.get({ key: 'mentorinaja-auth' });
          const { value: verifyExpert } = await Preferences.get({ key: 'mentorinaja-expert-info' });
          console.log('🔐 VERIFY - Session saved:', verifySession ? 'YES' : 'NO');
          console.log('🔐 VERIFY - Expert info saved:', verifyExpert ? 'YES' : 'NO');
        } catch (saveError) {
          console.error('🔐 Error saving to Preferences:', saveError);
        }
      }

      // Initialize push notifications and save device token
      if (pushNotificationService.isNativePlatform()) {
        await pushNotificationService.initialize();
      }
    } catch (error) {
      console.error('Error in loginAsExpert:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      // Deactivate push notification token before signing out
      if (pushNotificationService.isNativePlatform()) {
        await pushNotificationService.deactivateDeviceToken();
      }

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
      // Deactivate push notification token before signing out
      if (pushNotificationService.isNativePlatform()) {
        await pushNotificationService.deactivateDeviceToken();
      }

      // Clear Preferences before signing out (for native platforms)
      if (Capacitor.isNativePlatform()) {
        try {
          await Preferences.remove({ key: 'mentorinaja-auth' });
          await Preferences.remove({ key: 'mentorinaja-expert-info' });
          console.log('🔐 Session and expert info cleared from Preferences');
        } catch (clearError) {
          console.error('🔐 Error clearing Preferences:', clearError);
        }
      }

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