import "../global.css";

import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";
import { Platform, View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import remoteConfig from "@react-native-firebase/remote-config";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { useUpdates } from "@/hooks/useUpdates";

SplashScreen.preventAutoHideAsync();

setBaseUrl(getApiBaseUrl());

if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId: "534372451622-6b9v969v6k8q9v9k6b9v9k6b9v9k6b9v.apps.googleusercontent.com", // This will need to be updated with real webClientId from Firebase Console
    offlineAccess: true,
  });

  remoteConfig()
    .setDefaults({
      story_duration: 5,
      enable_reactions: true,
    })
    .then(() => remoteConfig().fetchAndActivate())
    .catch(error => console.error("Remote Config Error:", error));
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading, isProcessing, processingMessage } = useAuth();
  useUpdates();
  
  if (isLoading) return null;
  
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[id]" />
        {!user ? (
          <Stack.Screen name="edit-profile" />
        ) : (
          <>
            <Stack.Screen name="story/create" />
            <Stack.Screen name="story/[userId]" />
            <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
          </>
        )}
        <Stack.Screen name="settings" />
      </Stack>

      {isProcessing && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }
          ]}
        >
          <Image
            source={require("@/assets/images/parallaxa-logo.svg")}
            style={{ width: 120, height: 120, marginBottom: 24 }}
            contentFit="contain"
          />
          <Text
            style={{
              fontSize: 16,
              color: '#64748b',
              fontWeight: '600',
              fontFamily: 'Sora-Medium'
            }}
          >
            {processingMessage}
          </Text>
        </View>
      )}
    </>
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
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require("@/assets/images/parallaxa-logo.svg")}
          style={{ width: 100, height: 100 }}
          contentFit="contain"
        />
      </View>
    );
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
