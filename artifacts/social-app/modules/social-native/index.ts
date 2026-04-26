import { requireNativeModule } from 'expo-modules-core';

interface SocialNativeModule {
  getGreeting(): string;
}

let SocialNative: SocialNativeModule | null = null;
try {
  SocialNative = requireNativeModule<SocialNativeModule>('SocialNative');
} catch (e) {
  console.warn('SocialNative module not found');
}

export default SocialNative;
