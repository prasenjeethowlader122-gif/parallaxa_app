import "../global.css";

import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";

SplashScreen.preventAutoHideAsync();

// Works in all environments:
// - Replit dev / EAS mobile: uses EXPO_PUBLIC_DOMAIN env var
// - Docker/Render production web: uses window.location.origin (same origin as API)
setBaseUrl(getApiBaseUrl());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" redirect />
        <Stack.Screen name="post/[id]" redirect />
        <Stack.Screen name="profile/[id]" redirect />
        <Stack.Screen name="messages/index" redirect />
        <Stack.Screen name="messages/[id]" redirect />
        <Stack.Screen name="settings" redirect />
        <Stack.Screen name="edit-profile" redirect />
      </Stack>
    );
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" redirect />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="story/[userId]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  // app/_layout.tsx
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('@/assets/fonts/s_g/SpaceGrotesk-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/s_g/SpaceGrotesk-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/s_g/SpaceGrotesk-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/s_g/SpaceGrotesk-Bold.ttf'),
  });
  
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  if (!fontsLoaded && !fontError) return null;
  
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 , fontFamily: 'Inter-Regular'}}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}