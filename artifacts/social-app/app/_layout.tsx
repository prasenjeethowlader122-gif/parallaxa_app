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
import { Platform, View, ActivityIndicator } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing
} from "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

setBaseUrl(getApiBaseUrl());

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5))
    }, () => {
      // Hold for a bit then fade out
      opacity.value = withDelay(500, withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }));
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{
      flex: 1,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require("@/assets/images/parallaxa-logo.svg")}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
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
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
      </Stack>
    );
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="story/create" />
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

  const [splashFinished, setSplashFinished] = React.useState(false);

  useEffect(() => {
    if (fontError) console.error("Font load error:", fontError);
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!splashFinished && Platform.OS !== 'web') {
    return <AnimatedSplashScreen onFinish={() => setSplashFinished(true)} />;
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
