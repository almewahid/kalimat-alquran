import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kalimat.alquran',
  appName: 'كلمات القرآن',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'app',
  },
  plugins: {
    Browser: {
      presentationStyle: 'popover',
      windowName: '_self'
    },
    SplashScreen: {
      launchShowDuration: 0
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1096045632230-14dj83se3p0c9jdekcfhgprrhj7rgr2j.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
};

export default config;