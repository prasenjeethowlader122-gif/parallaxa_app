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
import { Platform, View,Image, ActivityIndicator } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
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
    "Sora-Regular": require("@/assets/fonts/mm/MirandaSans-Regular.ttf"),
    "Sora-Medium": require("@/assets/fonts/mm/MirandaSans-Medium.ttf"),
    "Sora-SemiBold": require("@/assets/fonts/mm/MirandaSans-Medium.ttf"),
    "Sora-Bold": require("@/assets/fonts/mm/MirandaSans-Bold.ttf"),
  });
  useEffect(() => {
    if (fontError) console.error("Font load error:", fontError);
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  if (!fontsLoaded && !fontError) {
    if (Platform.OS === 'web') {
      return (
        <View style={{ flex: 1, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center' }}>
          
            <Image
            source={require("@/assets/images/parallaxa-logo.svg")}
            style={{ width: 80, height: 80 }}
      />
    
        </View>
      );
    }
    return null;
  }
  
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <SocketProvider>
                  <RootLayoutNav />
                </SocketProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
