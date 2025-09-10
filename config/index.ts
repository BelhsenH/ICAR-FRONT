import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
}

const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

const config: Config = {
  apiUrl: 'http://192.168.1.122:8888' ,
  appName: Constants.expoConfig?.name || 'ICAR Mobile App',
  version: Constants.expoConfig?.version || '1.0.0',
};

// Override for different environments
if (isDevelopment) {
  // Check if running on Android emulator
  const isAndroidEmulator = Constants.platform?.android && Constants.isDevice === false;
  
  if (isAndroidEmulator) {
    // Android emulator uses 10.0.2.2 to access host machine
    config.apiUrl = 'http://10.0.2.2:8888';
  } else {
    // Use your computer's IP for physical devices/iOS simulator
    config.apiUrl = 'http://192.168.1.122:8888';
  }
}

if (isProduction) {
  // You can set your production API URL here
  // config.apiUrl = 'https://your-production-api.com/api';
}

export default config;
export type { Config };
