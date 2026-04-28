import { requireNativeModule } from 'expo-modules-core';

interface SocialNativeModule {
  pickImage(): Promise<string>;
  watermarkImage(uri: string, logoBase64: string): Promise<string>;
}

let SocialNative: SocialNativeModule | null = null;
try {
  SocialNative = requireNativeModule<SocialNativeModule>('SocialNative');
} catch (e) {
  console.warn('SocialNative module not found');
}

export default SocialNative;
