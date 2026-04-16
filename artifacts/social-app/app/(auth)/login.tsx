import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
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
        setErrors({
          general: data.message || "Login failed. Please check your credentials and try again.",
        });
        return;
      }

      await login(data.token, data.user);
    } catch (error) {
      setErrors({
        general: "Could not connect to server. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 24 : 0);
  const bottomPb = insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: topPt + 24,
          paddingBottom: bottomPb,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-black text-slate-900 tracking-tighter">
            Parallaxa
          </Text>
        </View>

        {/* Heading */}
        <Text className="text-3xl font-bold text-slate-900 mb-2">
          Sign in
        </Text>
        <Text className="text-base text-slate-500 mb-8">
          Welcome back to your social network
        </Text>

        {/* General Error */}
        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <View className="flex-row items-center gap-3">
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <Text className="flex-1 text-red-700 font-medium">{errors.general}</Text>
            </View>
          </View>
        )}

        {/* Email Input */}
        <View className="mb-4">
          <View
            className={`border rounded-lg px-4 py-3 flex-row items-center ${
              emailFocused
                ? "border-blue-500 bg-blue-50"
                : errors.email
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <TextInput
              className="flex-1 text-slate-900 text-base"
              placeholder="Email address"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {email && !errors.email && (
              <Feather name="check-circle" size={20} color="#10b981" />
            )}
          </View>
          {errors.email && (
            <Text className="mt-1.5 text-red-600 text-sm font-medium">
              {errors.email}
            </Text>
          )}
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <View
            className={`border rounded-lg px-4 py-3 flex-row items-center ${
              passwordFocused
                ? "border-blue-500 bg-blue-50"
                : errors.password
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <TextInput
              className="flex-1 text-slate-900 text-base"
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="ml-2"
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text className="mt-1.5 text-red-600 text-sm font-medium">
              {errors.password}
            </Text>
          )}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity className="mb-8">
          <Text className="text-blue-600 font-semibold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          className={`h-14 rounded-lg items-center justify-center mb-4 ${
            isLoading || !email || !password
              ? "bg-slate-200"
              : "bg-blue-600"
          }`}
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center gap-3 my-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="text-slate-500 text-sm font-medium">or</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Sign Up CTA */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 text-base">
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-blue-600 font-bold text-base">Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-auto pt-8 items-center">
          <Text className="text-slate-500 text-xs text-center leading-5">
            By signing in, you agree to our{" "}
            <Text className="text-blue-600 font-semibold">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-blue-600 font-semibold">Privacy Policy</Text>
            , including{" "}
            <Text className="text-blue-600 font-semibold">Cookie Use</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}