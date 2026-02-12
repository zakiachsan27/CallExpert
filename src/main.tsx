import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import App from "./App.tsx";
import "./index.css";
import { pushNotificationService } from './services/pushNotifications';
import { supabase, initializeAuthStorage } from './services/supabase';

// Initialize app
async function initApp() {
  // Set platform attribute on HTML for CSS targeting
  const platform = Capacitor.getPlatform();
  document.documentElement.setAttribute('data-platform', platform);
  console.log('📱 Platform:', platform);

  // Native platform specific initialization - BEFORE rendering
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Native platform detected, initializing...');

    // CRITICAL: Initialize auth storage from Preferences BEFORE anything else
    // This loads the stored session into memory so Supabase can access it
    await initializeAuthStorage();
    console.log('📱 Auth storage initialized');
  }

  // Now render the app (auth context will check session)
  createRoot(document.getElementById("root")!).render(<App />);

  // Post-render native initialization
  if (Capacitor.isNativePlatform()) {
    // Hide splash screen after app is rendered
    await SplashScreen.hide();

    // Initialize push notifications
    // Note: Token will be saved after user logs in (handled in AuthContext)
    await pushNotificationService.initialize();

    // Listen for app state changes (resume from background)
    CapApp.addListener('appStateChange', async ({ isActive }) => {
      console.log('📱 App state change:', isActive ? 'active' : 'background');

      if (isActive) {
        // When app becomes active, refresh the session
        // This ensures the session is properly restored after app was in background
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('📱 Session check on resume:', session ? 'exists' : 'null', error ? `error: ${error.message}` : '');

          if (session) {
            // Trigger a token refresh to ensure we have the latest token
            await supabase.auth.refreshSession();
            console.log('📱 Session refreshed on app resume');
          }
        } catch (error) {
          console.error('📱 Error checking session on resume:', error);
        }
      }
    });

    console.log('📱 App state listener registered');
  }
}

initApp();
  // Deploy trigger 1770870466
