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
import { ThemeProvider } from "@/context/ThemeContext";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { useUpdates } from "@/hooks/useUpdates";

SplashScreen.preventAutoHideAsync();

setBaseUrl(getApiBaseUrl());

if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId: "534372451622-6b9v969v6k8q9v9k6b9v9k6b9v9k6b9v.apps.googleusercontent.com",
    offlineAccess: true,
  });

  remoteConfig()
    .setDefaults({
      story_duration: 5,
      enable_reactions: true,
    })
    .then(() => remoteConfig().fetchAndActivate())
    .catch((error: any) => console.error("Remote Config Error:", error));
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
      <StatusBar style="auto" translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === "web" ? "none" : "slide_from_right",
          animationDuration: 260,
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[id]" />
        <Stack.Screen name="bookmarks" />
        {!user ? (
          <Stack.Screen name="edit-profile" />
        ) : (
          <>
            <Stack.Screen name="story/create" />
            <Stack.Screen name="story/[userId]" />
            <Stack.Screen
              name="edit-profile"
              options={{ presentation: "modal" }}
            />
          </>
        )}
        <Stack.Screen
          name="settings"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>

      {isProcessing && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#ffffff",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/parallaxa-logo.svg")}
            style={{ width: 100, height: 100, marginBottom: 32 }}
            contentFit="contain"
          />
          <ActivityIndicator
            size="large"
            color="#1d9bf0"
            style={{ marginBottom: 20 }}
          />
          <Text
            style={{
              fontSize: 15,
              color: "#64748b",
              fontWeight: "500",
              fontFamily: "Sora-Medium",
              letterSpacing: 0.1,
            }}
          >
            {processingMessage}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#94a3b8",
              marginTop: 6,
              fontFamily: "Sora-Regular",
            }}
          >
            Please wait a moment...
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
      <View
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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
        <ThemeProvider>
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
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
