import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.intellic.health',
  appName: 'INTELLIC Health',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1976D2',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976D2',
      showSpinner: false,
    },
  },
};

export default config;
