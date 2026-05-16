import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  Mail01Icon,
  LockPasswordIcon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons';
import { Text } from "@/components/Text";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
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
    if (showTotpInput && (!totpCode.trim() || totpCode.length !== 6)) {
      newErrors.general = "Please enter a valid 6-digit 2FA code";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      if (showTotpInput) {
        const response = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), code: totpCode }),
        });
        const data = await response.json();
        if (!response.ok) {
          setErrors({ general: data.message || "Invalid 2FA code" });
          setIsLoading(false);
          return;
        }
        await login(data.token, data.user);
        router.replace("/(tabs)");
        return;
      }
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.message || "Invalid email or password. Please try again." });
        return;
      }
      if (data.twoFactorRequired) {
        setShowTotpInput(true);
        setIsLoading(false);
        return;
      }
      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch (error) {
      setErrors({ general: "Connection failed. Please check your internet and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error("No ID token found");
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;
      const baseUrl = getApiBaseUrl();
      const idTokenFirebase = await firebaseUser.getIdToken();
      const response = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idTokenFirebase }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.message || "Failed to sign in with Google. Please try again." });
        return;
      }
      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(error);
      setErrors({ general: "Google sign in failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 24,
        }}
      >
        {/* Logo */}
        <View className="items-center mb-6">
          <Image
            source={require('@/assets/images/text-logo-dark.svg')}
            style={{ width: 160, height: 34 }}
            contentFit="contain"
          />
        </View>

        {/* Heading */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-slate-500">
            Sign in to continue to your account
          </Text>
        </View>

        {/* General Error Alert */}
        {errors.general && (
          <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
            <HugeiconsIcon icon={Alert01Icon} size={18} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-xs">
              {errors.general}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View className={`mb-4 ${showTotpInput ? 'opacity-50' : ''}`}>
          <Text className="text-slate-700 font-semibold mb-1.5 text-xs">
            Email Address
          </Text>
          <View
            className={`border rounded-full px-4 py-3 flex-row items-center ${
              emailFocused ? "border-black" : errors.email ? "border-red-300" : "border-slate-300"
            }`}
          >
            <HugeiconsIcon
              icon={Mail01Icon}
              size={17}
              color={emailFocused ? "#000" : "#64748b"}
              strokeWidth={1}
            />
            <TextInput
              className="flex-1 ml-3 outline-none text-black text-sm font-medium"
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
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} color="#10b981" />
            )}
          </View>
          {errors.email && (
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <HugeiconsIcon icon={InformationCircleIcon} size={13} color="#dc2626" />
              <Text className="text-red-600 text-xs font-medium">{errors.email}</Text>
            </View>
          )}
        </View>

        {/* Password Input */}
        <View className={`mb-3 ${showTotpInput ? 'opacity-50' : ''}`}>
          <Text className="text-slate-700 font-semibold mb-1.5 text-xs">
            Password
          </Text>
          <View
            className={`border rounded-full px-4 py-3 flex-row items-center ${
              passwordFocused ? "border-black" : errors.password ? "border-red-300" : "border-slate-300"
            }`}
          >
            <HugeiconsIcon
              icon={LockPasswordIcon}
              size={17}
              color={passwordFocused ? "#000" : "#64748b"}
              strokeWidth={1}
            />
            <TextInput
              className="flex-1 ml-3 outline-none text-gray-900 text-sm font-medium"
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
              <HugeiconsIcon
                icon={showPassword ? ViewOffIcon : ViewIcon}
                size={17}
                color={errors.password ? "#dc2626" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <HugeiconsIcon icon={InformationCircleIcon} size={13} color="#dc2626" />
              <Text className="text-red-600 text-xs font-medium">{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Forgot Password */}
        {!showTotpInput && (
          <TouchableOpacity
            className="self-end mb-5"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="text-blue-600 font-semibold text-xs">
              Forgot password?
            </Text>
          </TouchableOpacity>
        )}

        {/* 2FA Input */}
        {showTotpInput && (
          <View className="mb-4 mt-2">
            <Text className="text-slate-700 font-semibold mb-1.5 text-xs">
              2FA Code
            </Text>
            <View className="border rounded-full border-black px-4 py-3 flex-row items-center">
              <HugeiconsIcon icon={LockPasswordIcon} size={17} color="#000" strokeWidth={1} />
              <TextInput
                className="flex-1 ml-3 outline-none text-gray-900 text-sm font-medium"
                placeholder="000000"
                placeholderTextColor="#9ca3af"
                value={totpCode}
                onChangeText={setTotpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
            <TouchableOpacity onPress={() => setShowTotpInput(false)} className="mt-3">
              <Text className="text-blue-600 font-semibold text-xs text-center">
                Back to password
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign In Button */}
        <TouchableOpacity
          className="h-12 rounded-full items-center justify-center mb-3 bg-black"
          onPress={handleLogin}
          disabled={isLoading || !email || !password || (showTotpInput && totpCode.length !== 6)}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-sm">Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Google Sign In */}
        {Platform.OS !== 'web' && !showTotpInput && (
          <TouchableOpacity
            className="h-12 rounded-full items-center justify-center mb-3 bg-white border border-slate-200 flex-row gap-3"
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
              style={{ width: 18, height: 18 }}
            />
            <Text className="text-slate-900 font-bold text-sm">Continue with Google</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View className="flex-row items-center gap-3 my-4">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="text-slate-500 text-xs font-medium">OR</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Sign Up CTA */}
        <View className="flex-row justify-center items-center mb-4">
          <Text className="text-slate-600 text-xs">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-blue-600 font-bold text-xs">Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer — pushed to bottom */}
        <View className="flex-1 justify-end items-center">
          <Text className="text-slate-400 text-xs text-center leading-5">
            By signing in, you agree to our{" "}
            <Text className="text-blue-600 font-semibold">Terms of Service</Text>
            {" "}and{" "}
            <Text className="text-blue-600 font-semibold">Privacy Policy</Text>
            , including{" "}
            <Text className="text-blue-600 font-semibold">Cookie Use</Text>.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}