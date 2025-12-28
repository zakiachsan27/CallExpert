import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export interface NotificationData {
  type: 'chat' | 'booking' | 'payment' | 'reminder';
  bookingId?: string;
  expertId?: string;
  sessionId?: string;
  [key: string]: string | undefined;
}

class PushNotificationService {
  private isInitialized = false;
  private currentToken: string | null = null;

  /**
   * Check if we're running on a native platform
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current platform
   */
  getPlatform(): 'android' | 'ios' | 'web' {
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') {
      return platform;
    }
    return 'web';
  }

  /**
   * Initialize push notifications - call after user login
   */
  async initialize(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return true;
    }

    try {
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();
      console.log('Push notification permission status:', permStatus.receive);

      // Request permission if needed
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Setup listeners
      this.setupListeners();
      this.isInitialized = true;

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Setup all notification listeners
   */
  private setupListeners(): void {
    // Token received - save to database
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      this.currentToken = token.value;
      await this.saveDeviceToken(token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push notification received in foreground:', notification);

      // Show local notification since app is in foreground
      // (Push notifications don't show automatically when app is open)
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title || 'MentorinAja',
          body: notification.body || '',
          extra: notification.data
        }]
      });
    });

    // Notification tapped (app was in background or closed)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);
      const data = action.notification.data as NotificationData;
      this.handleNotificationTap(data);
    });

    // Local notification tapped
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Local notification action performed:', action);
      const data = action.notification.extra as NotificationData;
      if (data) {
        this.handleNotificationTap(data);
      }
    });
  }

  /**
   * Save device token to Supabase
   */
  async saveDeviceToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping token save');
        return;
      }

      const platform = this.getPlatform();

      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          device_name: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving device token:', error);
      } else {
        console.log('Device token saved successfully');
      }
    } catch (error) {
      console.error('Error in saveDeviceToken:', error);
    }
  }

  /**
   * Deactivate device token on logout
   */
  async deactivateDeviceToken(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.currentToken) return;

      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', this.currentToken);

      if (error) {
        console.error('Error deactivating device token:', error);
      } else {
        console.log('Device token deactivated');
      }
    } catch (error) {
      console.error('Error in deactivateDeviceToken:', error);
    }
  }

  /**
   * Remove all device tokens for current user
   */
  async removeAllDeviceTokens(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing device tokens:', error);
      }
    } catch (error) {
      console.error('Error in removeAllDeviceTokens:', error);
    }
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private handleNotificationTap(data: NotificationData): void {
    if (!data?.type) return;

    console.log('Handling notification tap:', data);

    switch (data.type) {
      case 'chat':
        if (data.bookingId) {
          window.location.href = `/session?bookingId=${data.bookingId}`;
        }
        break;

      case 'booking':
        // For experts - go to dashboard/transactions
        window.location.href = '/expert/dashboard';
        break;

      case 'payment':
        if (data.bookingId) {
          window.location.href = `/invoice/${data.bookingId}`;
        } else {
          window.location.href = '/user/transactions';
        }
        break;

      case 'reminder':
        if (data.bookingId) {
          window.location.href = `/session?bookingId=${data.bookingId}`;
        }
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  /**
   * Request notification permission (can be called manually)
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermission(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }

    try {
      const result = await PushNotifications.checkPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
