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
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";

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
  const [errors, setErrors] = useState < { email ? : string;password ? : string;general ? : string } > ({});
  
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
    
    if (!validateForm()) {
      return;
    }
    
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
        setErrors({
          general: data.message || "Invalid email or password. Please try again.",
        });
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
      setErrors({
        general: "Connection failed. Please check your internet and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error("No ID token found");
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = userCredential.user;

      // Now we need to sync this user with our backend
      const baseUrl = getApiBaseUrl();
      const idTokenFirebase = await firebaseUser.getIdToken();

      const response = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idTokenFirebase }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.message || "Failed to sign in with Google. Please try again.",
        });
        return;
      }

      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(error);
      setErrors({
        general: "Google sign in failed. Please try again.",
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
          <Image
            source={require('@/assets/images/text-logo-dark.svg')}
            style={{ width: 180, height: 44 }}
            contentFit="contain"
          />
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
            <HugeiconsIcon icon={Alert01Icon} size={20} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-sm">
              {errors.general}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View className={`mb-3 ${showTotpInput ? 'opacity-50' : ''}`}>
          <FloatingLabelInput
            label="Email Address"
            icon={Mail01Icon}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            right={email && !errors.email && (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#10b981" />
            )}
          />
        </View>

        {/* Password Input */}
        <View className={`mb-2 ${showTotpInput ? 'opacity-50' : ''}`}>
          <FloatingLabelInput
            label="Password"
            icon={LockPasswordIcon}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            right={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="p-1"
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffIcon : ViewIcon}
                  size={18}
                  color={errors.password ? "#dc2626" : "#6b7280"}
                />
              </TouchableOpacity>
            }
          />
        </View>

        {/* Forgot Password Link */}
        {!showTotpInput && (
          <TouchableOpacity
            className="self-end mb-8"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="text-blue-600 font-semibold text-sm">
              Forgot password?
            </Text>
          </TouchableOpacity>
        )}

        {/* 2FA Input */}
        {showTotpInput && (
          <View className="mb-6 mt-4">
            <FloatingLabelInput
              label="2FA Code"
              icon={LockPasswordIcon}
              value={totpCode}
              onChangeText={setTotpCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowTotpInput(false)} className="mt-4">
              <Text className="text-blue-600 font-semibold text-sm text-center">
                Back to password
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign In Button */}
        <TouchableOpacity
          className="h-14 rounded-full items-center justify-center mb-4 bg-black"
          onPress={handleLogin}
          disabled={isLoading || !email || !password || (showTotpInput && totpCode.length !== 6)}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Google Sign In Button */}
        {Platform.OS !== 'web' && !showTotpInput && (
          <TouchableOpacity
            className="h-14 rounded-full items-center justify-center mb-4 bg-white border border-slate-200 flex-row gap-3"
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
              style={{ width: 20, height: 20 }}
            />
            <Text className="text-slate-900 font-bold text-base">Continue with Google</Text>
          </TouchableOpacity>
        )}

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