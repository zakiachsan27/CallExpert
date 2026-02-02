import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

// Create Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Check if running on native platform
const isNative = Capacitor.isNativePlatform();

// In-memory cache for native platform (sync access for Supabase)
const memoryCache: Record<string, string> = {};

// Track if storage has been initialized
let storageInitialized = false;

// Initialize cache from Preferences on app start (for native)
// This MUST be called before any Supabase auth operations
export const initializeAuthStorage = async () => {
  if (!isNative) return;

  console.log('🔐 ====== COLD START - INITIALIZING AUTH STORAGE ======');
  console.log('🔐 Timestamp:', new Date().toISOString());

  try {
    // First, list ALL keys in Preferences to see what's stored
    const { value } = await Preferences.get({ key: 'mentorinaja-auth' });
    const { value: expertValue } = await Preferences.get({ key: 'mentorinaja-expert-info' });

    console.log('🔐 Preferences content check:');
    console.log('   - mentorinaja-auth:', value ? `FOUND (${value.length} chars)` : 'NOT FOUND');
    console.log('   - mentorinaja-expert-info:', expertValue ? 'FOUND' : 'NOT FOUND');

    if (value) {
      memoryCache['mentorinaja-auth'] = value;
      console.log('🔐 Loaded auth session into memoryCache');

      // CRITICAL: After loading from Preferences, we need to manually restore the session
      // because Supabase already checked storage when client was created (and found nothing)
      try {
        const sessionData = JSON.parse(value);
        console.log('🔐 Parsed session data:');
        console.log('   - has access_token:', !!sessionData?.access_token);
        console.log('   - has refresh_token:', !!sessionData?.refresh_token);
        console.log('   - has user:', !!sessionData?.user);
        console.log('   - user_id:', sessionData?.user?.id);
        console.log('   - expires_at:', sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toISOString() : 'N/A');

        // Check if token is expired
        if (sessionData?.expires_at) {
          const expiresAt = new Date(sessionData.expires_at * 1000);
          const now = new Date();
          const isExpired = expiresAt < now;
          console.log('   - token expired:', isExpired, `(expires: ${expiresAt.toISOString()}, now: ${now.toISOString()})`);
        }

        if (sessionData?.access_token && sessionData?.refresh_token) {
          console.log('🔐 Calling supabase.auth.setSession()...');
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });
          if (error) {
            console.error('🔐 ERROR in setSession:', error.message, error);
            // Session might be expired, clear it
            if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('Invalid Refresh Token')) {
              console.log('🔐 Session expired/invalid, clearing stored data');
              delete memoryCache['mentorinaja-auth'];
              await Preferences.remove({ key: 'mentorinaja-auth' });
              await Preferences.remove({ key: 'mentorinaja-expert-info' });
            }
          } else if (data.session) {
            console.log('🔐 SUCCESS! Session restored for user:', data.session.user.id);
            storageInitialized = true;

            // Update memoryCache with fresh session data
            const freshSessionData = {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user: data.session.user,
              token_type: 'bearer',
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
            };
            memoryCache['mentorinaja-auth'] = JSON.stringify(freshSessionData);

            // Also update Preferences with fresh data
            await Preferences.set({
              key: 'mentorinaja-auth',
              value: JSON.stringify(freshSessionData),
            });
            console.log('🔐 Updated Preferences with fresh session data');
          } else {
            console.log('🔐 WARNING: setSession returned no error but also no session!');
          }
        }
      } catch (parseError) {
        console.error('🔐 Error parsing stored session:', parseError);
        // Clear invalid data
        delete memoryCache['mentorinaja-auth'];
        await Preferences.remove({ key: 'mentorinaja-auth' });
      }
    } else {
      console.log('🔐 No stored auth session found - user needs to login');
    }
  } catch (error) {
    console.error('🔐 Error loading auth from Preferences:', error);
  }

  console.log('🔐 ====== AUTH STORAGE INIT COMPLETE ======');
};

// Helper to check if storage was initialized successfully
export const isStorageInitialized = () => storageInitialized;

// Custom storage adapter using Capacitor Preferences for native
const nativeStorage = {
  getItem: (key: string): string | null => {
    const value = memoryCache[key] || null;
    // Only log for auth key to reduce noise
    if (key === 'mentorinaja-auth') {
      console.log(`🔐 Storage getItem(${key}):`, value ? `found (${value.length} chars)` : 'null');
    }
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log(`🔐 Storage setItem(${key}):`, value ? `setting (${value.length} chars)` : 'clearing');
    memoryCache[key] = value;

    // IMPORTANT: Save to Preferences with better error handling
    // Using immediate async IIFE to ensure we await the save
    (async () => {
      try {
        await Preferences.set({ key, value });
        console.log(`🔐 Storage setItem(${key}): SAVED to Preferences`);

        // Verify the save worked
        const { value: verify } = await Preferences.get({ key });
        if (verify === value) {
          console.log(`🔐 Storage setItem(${key}): VERIFIED`);
        } else {
          console.error(`🔐 Storage setItem(${key}): VERIFY FAILED - data mismatch!`);
        }
      } catch (err) {
        console.error('🔐 Error saving to Preferences:', err);
      }
    })();
  },
  removeItem: (key: string) => {
    console.log(`🔐 Storage removeItem(${key})`);
    delete memoryCache[key];

    // Async remove from Preferences
    (async () => {
      try {
        await Preferences.remove({ key });
        console.log(`🔐 Storage removeItem(${key}): REMOVED from Preferences`);
      } catch (err) {
        console.error('🔐 Error removing from Preferences:', err);
      }
    })();
  },
};

// Web storage adapter using localStorage
const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative, // Disable URL detection on native
    storage: isNative ? nativeStorage : webStorage,
    storageKey: 'mentorinaja-auth', // Custom key to avoid conflicts
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper to get authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to check if user is an expert
export const isUserExpert = async (userId: string) => {
  const { data, error } = await supabase
    .from('experts')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
};

