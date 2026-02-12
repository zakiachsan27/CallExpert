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

  try {
    const { value } = await Preferences.get({ key: 'mentorinaja-auth' });
    const { value: expertValue } = await Preferences.get({ key: 'mentorinaja-expert-info' });

    if (value) {
      memoryCache['mentorinaja-auth'] = value;

      try {
        const sessionData = JSON.parse(value);

        if (sessionData?.access_token && sessionData?.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          });
          if (error) {
            if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('Invalid Refresh Token')) {
              delete memoryCache['mentorinaja-auth'];
              await Preferences.remove({ key: 'mentorinaja-auth' });
              await Preferences.remove({ key: 'mentorinaja-expert-info' });
            }
          } else if (data.session) {
            storageInitialized = true;

            const freshSessionData = {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user: data.session.user,
              token_type: 'bearer',
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
            };
            memoryCache['mentorinaja-auth'] = JSON.stringify(freshSessionData);

            await Preferences.set({
              key: 'mentorinaja-auth',
              value: JSON.stringify(freshSessionData),
            });
          }
        }
      } catch {
        delete memoryCache['mentorinaja-auth'];
        await Preferences.remove({ key: 'mentorinaja-auth' });
      }
    }
  } catch (error) {
    // Silent fail - user will need to login
  }
};

// Helper to check if storage was initialized successfully
export const isStorageInitialized = () => storageInitialized;

// Custom storage adapter using Capacitor Preferences for native
const nativeStorage = {
  getItem: (key: string): string | null => {
    return memoryCache[key] || null;
  },
  setItem: (key: string, value: string) => {
    memoryCache[key] = value;
    (async () => {
      try {
        await Preferences.set({ key, value });
      } catch {
        // Silent fail
      }
    })();
  },
  removeItem: (key: string) => {
    delete memoryCache[key];
    (async () => {
      try {
        await Preferences.remove({ key });
      } catch {
        // Silent fail
      }
    })();
  },
};

// Web storage adapter using localStorage
const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative,
    storage: isNative ? nativeStorage : webStorage,
    storageKey: 'mentorinaja-auth',
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
