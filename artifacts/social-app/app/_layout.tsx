import "../global.css";

import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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
  const [fontsLoaded, fontError] = useFonts({
    "SpaceGrotesk-Regular": require("@/assets/fonts/sora/Sora-Regular.ttf"),
    "SpaceGrotesk-Medium": require("@/assets/fonts/sora/Sora-Medium.ttf"),
    "SpaceGrotesk-SemiBold": require("@/assets/fonts/sora/Sora-SemiBold.ttf"),
    "SpaceGrotesk-Bold": require("@/assets/fonts/sora/Sora-Bold.ttf"),
  });

  useEffect(() => {
    if (fontError) console.error("Font load error:", fontError);
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
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