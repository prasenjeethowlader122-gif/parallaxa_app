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

type FormErrors = {
  displayName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type FloatingInputProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  placeholder?: string;
  error?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
};

function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = "none",
  secureTextEntry = false,
  placeholder,
  error,
  focused,
  onFocus,
  onBlur,
  rightElement,
  disabled = false,
}: FloatingInputProps) {
  const isValid = value && !error;

  return (
    <View className="mb-4">
      <Text className={`text-sm font-semibold mb-2 ${focused ? "text-blue-600" : "text-slate-700"}`}>
        {label}
      </Text>
      <View
        className={`border rounded-lg px-4 py-3 flex-row items-center ${
          focused
            ? "border-blue-500 bg-blue-50"
            : error
              ? "border-red-300 bg-red-50"
              : "border-slate-200 bg-white"
        }`}
      >
        <TextInput
          className="flex-1 text-slate-900 text-base"
          placeholder={placeholder || label}
          placeholderTextColor="#d1d5db"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
        />
        {isValid && (
          <Feather name="check-circle" size={20} color="#10b981" />
        )}
        {rightElement}
      </View>
      {error && (
        <Text className="mt-1.5 text-red-600 text-sm font-medium">
          {error}
        </Text>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [displayNameFocused, setDisplayNameFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Display Name validation
    if (!displayName.trim()) {
      newErrors.displayName = "Name is required";
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = "Name must be at least 2 characters";
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      newErrors.username = "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general:
            data.message ||
            "Registration failed. Please check your information and try again.",
        });
        return;
      }

      await login(data.token, data.user);
    } catch (error) {
      setErrors({
        general:
          "Could not connect to server. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 16 : 0);
  const bottomPb = insets.bottom + 24;

  const isFormValid =
    displayName.trim() &&
    username.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    !errors.displayName &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: topPt + 16,
          paddingBottom: bottomPb,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row: back + logo */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center rounded-full bg-slate-100"
          >
            <Feather name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>

          <Text className="text-2xl font-black text-slate-900">Parallaxa</Text>

          <View className="w-9" />
        </View>

        {/* Heading */}
        <Text className="text-3xl font-bold text-slate-900 mb-1">
          Create account
        </Text>
        <Text className="text-base text-slate-500 mb-6">
          Join our community today
        </Text>

        {/* General Error */}
        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <View className="flex-row items-start gap-3">
              <Feather name="alert-circle" size={20} color="#dc2626" className="mt-0.5" />
              <Text className="flex-1 text-red-700 font-medium">{errors.general}</Text>
            </View>
          </View>
        )}

        {/* Form Fields */}
        <FloatingInput
          label="Full Name"
          placeholder="John Doe"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          error={errors.displayName}
          focused={displayNameFocused}
          onFocus={() => setDisplayNameFocused(true)}
          onBlur={() => setDisplayNameFocused(false)}
          disabled={isLoading}
        />

        <FloatingInput
          label="Username"
          placeholder="john_doe"
          value={username}
          onChangeText={setUsername}
          error={errors.username}
          focused={usernameFocused}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
          disabled={isLoading}
        />

        <FloatingInput
          label="Email"
          placeholder="john@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          focused={emailFocused}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          disabled={isLoading}
        />

        <FloatingInput
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          error={errors.password}
          focused={passwordFocused}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          rightElement={
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
          }
          disabled={isLoading}
        />

        <FloatingInput
          label="Confirm Password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          error={errors.confirmPassword}
          focused={confirmPasswordFocused}
          onFocus={() => setConfirmPasswordFocused(true)}
          onBlur={() => setConfirmPasswordFocused(false)}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="ml-2"
            >
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          }
          disabled={isLoading}
        />

        {/* Terms note */}
        <Text className="text-slate-600 text-xs leading-5 mb-6">
          By signing up, you agree to our{" "}
          <Text className="text-blue-600 font-semibold">Terms of Service</Text>
          {" "}and{" "}
          <Text className="text-blue-600 font-semibold">Privacy Policy</Text>
          , including{" "}
          <Text className="text-blue-600 font-semibold">Cookie Use</Text>.
        </Text>

        {/* Create Account Button */}
        <TouchableOpacity
          className={`h-14 rounded-lg items-center justify-center mb-4 ${
            isLoading || !isFormValid ? "bg-slate-200" : "bg-blue-600"
          }`}
          onPress={handleRegister}
          disabled={isLoading || !isFormValid}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Create account</Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 text-base">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text className="text-blue-600 font-bold text-base">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}