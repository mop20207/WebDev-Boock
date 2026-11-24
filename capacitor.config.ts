import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webdevbook.app',
  appName: 'WebDev Book',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#080d18'
  }
};

export default config;
