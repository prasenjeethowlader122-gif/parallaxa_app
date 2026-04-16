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

type InputFieldProps = {
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
  icon?: string;
};

function InputField({
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
  icon,
}: InputFieldProps) {
  const isValid = value && !error;

  const iconColorMap: Record<string, string> = {
    "user": "#9ca3af",
    "at-sign": "#9ca3af",
    "mail": "#9ca3af",
    "lock": "#9ca3af",
  };

  const getIconColor = () => {
    if (focused) return "#3b82f6";
    if (error) return "#dc2626";
    return iconColorMap[icon || ""] || "#9ca3af";
  };

  return (
    <View className="mb-5">
      <Text className={`text-sm font-semibold mb-2 ${
        focused ? "text-blue-600" : error ? "text-red-600" : "text-slate-700"
      }`}>
        {label}
      </Text>
      <View
        className={`border rounded-xl px-4 py-3 flex-row items-center transition-colors ${
          focused
            ? "border-blue-500 bg-blue-50"
            : error
              ? "border-red-300 bg-red-50"
              : "border-slate-300 bg-slate-50"
        }`}
      >
        {icon && (
          <Feather
            name={icon as any}
            size={18}
            color={getIconColor()}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          className="flex-1 text-slate-900 text-base font-medium"
          placeholder={placeholder || label}
          placeholderTextColor="#d1d5db"
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Clear error on change
            if (error) onChangeText(text);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
        />
        {isValid && (
          <Feather name="check-circle" size={18} color="#10b981" style={{ marginLeft: 8 }} />
        )}
        {rightElement}
      </View>
      {error && (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Feather name="info" size={14} color="#dc2626" />
          <Text className="text-red-600 text-xs font-medium flex-1">
            {error}
          </Text>
        </View>
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
      newErrors.displayName = "Full name is required";
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = "Name must be at least 2 characters";
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = "Name must be less than 50 characters";
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.trim().length > 30) {
      newErrors.username = "Username must be less than 30 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      newErrors.username = "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (password.length > 128) {
      newErrors.password = "Password must be less than 128 characters";
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
        const errorMessage = data.message || "Registration failed. Please check your information and try again.";
        
        // Handle field-specific errors from backend
        if (data.field) {
          setErrors({
            [data.field]: errorMessage,
          } as FormErrors);
        } else {
          setErrors({
            general: errorMessage,
          });
        }
        return;
      }

      await login(data.token, data.user);
    } catch (error) {
      setErrors({
        general: "Connection failed. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 24 : 0);
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
          paddingTop: topPt + 24,
          paddingBottom: bottomPb,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row: back + logo */}
        <View className="flex-row items-center justify-between mb-12">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          >
            <Feather name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>

          <Text className="text-2xl font-black text-slate-900">
            Parallaxa
          </Text>

          <View className="w-10" />
        </View>

        {/* Heading */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            Create account
          </Text>
          <Text className="text-base text-slate-500">
            Join our community today
          </Text>
        </View>

        {/* General Error Alert */}
        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
            <Feather name="alert-circle" size={20} color="#dc2626" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-red-700 font-semibold text-sm">
              {errors.general}
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <InputField
          icon="user"
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

        <InputField
          icon="at-sign"
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

        <InputField
          icon="mail"
          label="Email Address"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          focused={emailFocused}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          disabled={isLoading}
        />

        <InputField
          icon="lock"
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
              className="p-1"
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={errors.password ? "#dc2626" : "#6b7280"}
              />
            </TouchableOpacity>
          }
          disabled={isLoading}
        />

        <InputField
          icon="lock"
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
              className="p-1"
            >
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={18}
                color={errors.confirmPassword ? "#dc2626" : "#6b7280"}
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
          className={`h-14 rounded-xl items-center justify-center mb-4 transition-opacity ${
            isLoading || !isFormValid
              ? "bg-slate-200"
              : "bg-blue-600 active:bg-blue-700"
          }`}
          onPress={handleRegister}
          disabled={isLoading || !isFormValid}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-bold text-base">Create account</Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 text-sm">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text className="text-blue-600 font-bold text-sm">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}