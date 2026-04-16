import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Login Failed", data.message ?? "Invalid credentials");
        return;
      }
      await login(data.token, data.user);
    } catch {
      Alert.alert("Error", "Could not connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0) + 40;
  const bottomPb = insets.bottom + 40;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: topPt, paddingBottom: bottomPb }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
            <Feather name="camera" size={36} color="#FFFFFF" />
          </View>
          <Text className="text-4xl font-bold -tracking-wide" style={{ color: colors.foreground }}>
            Pulse
          </Text>
          <Text className="text-[15px] mt-1" style={{ color: colors.mutedForeground }}>
            Share your moments
          </Text>
        </View>

        {/* Form */}
        <View className="gap-3">
          <View
            className="flex-row items-center border rounded-xl px-3.5 h-[50px] gap-2.5"
            style={{ borderColor: colors.border, backgroundColor: colors.input }}
          >
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 text-[15px]"
              style={{ color: colors.foreground }}
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            className="flex-row items-center border rounded-xl px-3.5 h-[50px] gap-2.5"
            style={{ borderColor: colors.border, backgroundColor: colors.input }}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 text-[15px]"
              style={{ color: colors.foreground }}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="h-[50px] rounded-xl bg-primary items-center justify-center mt-1"
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white">Log in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2">
            <Text className="text-sm font-medium text-primary">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6 gap-3">
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
          <Text className="text-[13px] font-semibold" style={{ color: colors.mutedForeground }}>OR</Text>
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
        </View>

        {/* Sign up */}
        <View className="flex-row justify-center items-center">
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-sm font-bold text-primary"> Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
