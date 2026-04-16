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

// Import Hugeicons
import { 
  UserIcon, 
  AtSignIcon, 
  Mail01Icon, 
  LockPasswordIcon, 
  ViewIcon, 
  ViewOffSlashIcon, 
  ArrowLeft02Icon, 
  ArrowRight02Icon, 
  InformationCircleIcon,
  TickCircleIcon,
  AlertCircleIcon
} from "hugeicons-react-native";

type FormErrors = {
  displayName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const TOTAL_STEPS = 3;

const STEPS = [
  { title: "Who are you?", subtitle: "Let's start with your name and username" },
  { title: "Your email",   subtitle: "We'll use this to sign you in"            },
  { title: "Secure it",    subtitle: "Create a strong password"                  },
];

export default function RegisterScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { login } = useAuth();

  /* ─── form state ─── */
  const [step, setStep]                   = useState(0);
  const [displayName, setDisplayName]     = useState("");
  const [username, setUsername]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [errors, setErrors]               = useState<FormErrors>({});

  /* ─── focus state ─── */
  const [displayNameFocused, setDNF]   = useState(false);
  const [usernameFocused,    setUNF]   = useState(false);
  const [emailFocused,       setEF]    = useState(false);
  const [passwordFocused,    setPF]    = useState(false);
  const [confirmFocused,     setCF]    = useState(false);

  const topPt    = insets.top + (Platform.OS === "web" ? 24 : 0);
  const bottomPb = insets.bottom + 24;

  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};
    if (step === 0) {
      if (!displayName.trim()) newErrors.displayName = "Full name is required";
      if (!username.trim()) newErrors.username = "Username is required";
      else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) newErrors.username = "Letters, numbers, _ and - only";
    }
    if (step === 1) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = "Valid email is required";
    }
    if (step === 2) {
      if (password.length < 6) newErrors.password = "Min 6 characters required";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
  };

  const goBack = () => {
    if (step > 0) { setStep(s => s - 1); setErrors({}); }
    else router.back();
  };

  const handleRegister = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username: username.toLowerCase(), email: email.toLowerCase(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.field ? { [data.field]: data.message } : { general: data.message });
        return;
      }
      await login(data.token, data.user);
    } catch {
      setErrors({ general: "Connection failed. Check your internet." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── reusable input ─── */
  const InputRow = ({
    Icon,
    placeholder,
    value,
    onChange,
    focused,
    onFocus,
    onBlur,
    error,
    secure = false,
    right,
    keyboardType,
    autoCapitalize = "none",
  }: any) => (
    <View className="mb-5">
      <View
        className={`border rounded-2xl px-4 py-4 flex-row items-center ${
          focused ? "border-black bg-white" : error ? "border-red-300 bg-red-50/30" : "border-gray-100 bg-gray-50/50"
        }`}
      >
        <Icon
          size={20}
          color={focused ? "#000" : error ? "#dc2626" : "#9ca3af"}
          variant={focused ? "stroke" : "twotone"}
        />
        <TextInput
          className="flex-1 ml-3 text-gray-900 text-base font-medium"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={!isLoading}
        />
        {value && !error && !secure && (
          <TickCircleIcon size={20} color="#10b981" variant="solid" />
        )}
        {right}
      </View>
      {error && (
        <View className="mt-2 flex-row items-center gap-1.5 px-1">
          <InformationCircleIcon size={14} color="#dc2626" />
          <Text className="text-red-600 text-xs font-medium">{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: topPt + 32, paddingBottom: bottomPb, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        
        {/* Navigation */}
        <View className="flex-row items-center mb-10">
          <TouchableOpacity onPress={goBack} className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
            <ArrowLeft02Icon size={22} color="#000" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <View key={i} className={`h-1.5 rounded-full ${i <= step ? "bg-black" : "bg-gray-100"}`} style={{ width: i === step ? 32 : 8 }} />
            ))}
          </View>
          <View className="w-12" />
        </View>

        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 mb-2">{STEPS[step].title}</Text>
          <Text className="text-base text-slate-500">{STEPS[step].subtitle}</Text>
        </View>

        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex-row items-center gap-3">
            <AlertCircleIcon size={20} color="#dc2626" variant="solid" />
            <Text className="flex-1 text-red-700 font-medium text-sm">{errors.general}</Text>
          </View>
        )}

        {/* Steps */}
        {step === 0 && (
          <>
            <InputRow Icon={UserIcon} placeholder="Full Name" value={displayName} onChange={(t: string) => setDisplayName(t)} focused={displayNameFocused} onFocus={() => setDNF(true)} onBlur={() => setDNF(false)} error={errors.displayName} autoCapitalize="words" />
            <InputRow Icon={AtSignIcon} placeholder="Username" value={username} onChange={(t: string) => setUsername(t)} focused={usernameFocused} onFocus={() => setUNF(true)} onBlur={() => setUNF(false)} error={errors.username} />
          </>
        )}

        {step === 1 && (
          <InputRow Icon={Mail01Icon} placeholder="Email Address" value={email} onChange={(t: string) => setEmail(t)} focused={emailFocused} onFocus={() => setEF(true)} onBlur={() => setEF(false)} error={errors.email} keyboardType="email-address" />
        )}

        {step === 2 && (
          <>
            <InputRow Icon={LockPasswordIcon} placeholder="Password" value={password} onChange={(t: string) => setPassword(t)} focused={passwordFocused} onFocus={() => setPF(true)} onBlur={() => setPF(false)} error={errors.password} secure={!showPassword} right={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>{showPassword ? <ViewOffSlashIcon size={20} color="#6b7280" /> : <ViewIcon size={20} color="#6b7280" />}</TouchableOpacity>
            } />
            <InputRow Icon={LockPasswordIcon} placeholder="Confirm Password" value={confirmPassword} onChange={(t: string) => setConfirmPass(t)} focused={confirmFocused} onFocus={() => setCF(true)} onBlur={() => setCF(false)} error={errors.confirmPassword} secure={!showConfirm} right={
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>{showConfirm ? <ViewOffSlashIcon size={20} color="#6b7280" /> : <ViewIcon size={20} color="#6b7280" />}</TouchableOpacity>
            } />
          </>
        )}

        <TouchableOpacity className="h-16 rounded-2xl bg-black items-center justify-center mt-4" onPress={step === 2 ? handleRegister : goNext} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : (
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-lg">{step === 2 ? "Create Account" : "Continue"}</Text>
              {step < 2 && <ArrowRight02Icon size={20} color="white" />}
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}