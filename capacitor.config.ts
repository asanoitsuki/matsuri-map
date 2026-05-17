import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.matsurimap.app',
  appName: 'MatsuriMap',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#E63946',
      showSpinner: false,
      launchFadeOutDuration: 500,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#E63946',
    },
    Geolocation: {
      permissions: {
        ios: ['whenInUse'],
      },
    },
  },
}

export default config
