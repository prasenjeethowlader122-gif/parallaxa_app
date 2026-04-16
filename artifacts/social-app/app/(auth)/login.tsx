import { Feather } from '@expo/vector-icons';
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
import { Image } from "react-native";

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
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
          general: data.message || "Invalid email or password. Please try again.",
        });
        return;
      }

      await login(data.token, data.user);
    } catch (error) {
      setErrors({
        general: "Connection failed. Please check your internet and try again.",
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
          paddingTop: topPt + 32,
          paddingBottom: bottomPb,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <Image source={require('@/assets/images/placeholder-logo.svg')} style={{ width: 50, height: 50 }} />
        </View>

        {/* Heading */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 mb-3">
            Welcome back
          </Text>
          <Text className="text-base text-slate-500">
            Sign in to continue to your account
          </Text>
        </View>

        {/* General Error Alert */}
        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
            <Feather name="alert-circle" size={20} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-sm">
              {errors.general}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View className="mb-5">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">
            Email Address
          </Text>
          <View
            className={`border rounded-full border-gray-100 px-4 py-3 flex-row items-center transition-colors ${
              emailFocused
                ? "border-black"
                : errors.email
                  ? "border-red-300"
                  : "border-slate-300"
            }`}
          >
            <Feather
              name="mail"
              size={18}
              color={emailFocused ? "#3b82f6" : errors.email ? "#dc2626" : "#9ca3af"}
            />
            <TextInput
              className="flex-1 ml-3 outline-none text-black-900 text-base font-medium"
              placeholder="your.email@example.com"
              placeholderTextColor="#d1d5db"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {email && !errors.email && (
              <Feather name="check-circle" size={18} color="#10b981" />
            )}
          </View>
          {errors.email && (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Feather name="info" size={14} color="#dc2626" />
              <Text className="text-red-600 text-xs font-medium">
                {errors.email}
              </Text>
            </View>
          )}
        </View>

        {/* Password Input */}
        <View className="mb-4">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">
            Password
          </Text>
          <View
            className={`border rounded-full border-gray-100 px-4 py-3 flex-row items-center transition-colors ${
              passwordFocused
                ? "border-black"
                : errors.password
                  ? "border-red-300"
                  : "border-slate-300"
            }`}
          >
            <Feather
              name="lock"
              size={18}
              color={passwordFocused ? "#3b82f6" : errors.password ? "#dc2626" : "#9ca3af"}
            />
            <TextInput
              className="flex-1 ml-3 outline-none text-gray-900 text-base font-medium"
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="p-1"
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={errors.password ? "#dc2626" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Feather name="info" size={14} color="#dc2626" />
              <Text className="text-red-600 text-xs font-medium">
                {errors.password}
              </Text>
            </View>
          )}
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity className="self-end mb-8">
          <Text className="text-blue-600 font-semibold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center mb-4 transition-opacity text-white ${
            isLoading || !email || !password
              ? "bg-black"
              : "bg-black"
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
          <Text className="text-slate-500 text-xs font-medium">OR</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Sign Up CTA */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 text-sm">
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-blue-600 font-bold text-sm">Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-auto pt-12 items-center">
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