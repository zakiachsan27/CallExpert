import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentorinaja.app',
  appName: 'MentorinAja',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4F46E5",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#4F46E5",
      sound: "notification.wav"
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
