import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  UserIcon, 
  AtSignIcon, 
  Mail01Icon, 
  LockPasswordIcon, 
  ViewIcon, 
  ViewOffIcon, 
  ArrowLeft02Icon, 
  ArrowRight02Icon, 
  Alert01Icon, 
  CheckmarkCircle01Icon, 
  InformationCircleIcon 
} from '@hugeicons/core-free-icons';

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
// Ensure these paths are correct in your project
// import { useAuth } from "@/context/AuthContext";
// import { getApiBaseUrl } from "@/lib/apiUrl";

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
  // const { login } = useAuth(); // Uncomment when ready

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
      if (!displayName.trim())                 newErrors.displayName = "Full name is required";
      else if (displayName.trim().length < 2)  newErrors.displayName = "Name must be at least 2 characters";
      
      if (!username.trim())                    newErrors.username = "Username is required";
      else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
        newErrors.username = "Letters, numbers, _ and - only";
    }

    if (step === 1) {
      if (!email.trim())                       newErrors.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        newErrors.email = "Please enter a valid email address";
    }

    if (step === 2) {
      if (!password)                   newErrors.password = "Password is required";
      else if (password.length < 6)    newErrors.password = "Password must be at least 6 characters";

      if (!confirmPassword)            newErrors.confirmPassword = "Please confirm your password";
      else if (password !== confirmPassword)  newErrors.confirmPassword = "Passwords do not match";
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
      // Mocking the API call logic
      // const baseUrl = getApiBaseUrl();
      // const response = await fetch(`${baseUrl}/api/auth/register`, { ... });
      // const data = await response.json();
      console.log("Registering...", { displayName, username, email, password });
      
      // await login(data.token, data.user);
    } catch {
      setErrors({ general: "Connection failed. Check your internet and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── reusable input ─── */
  const InputRow = ({
    icon,
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
        className={`border rounded-full px-4 py-3 flex-row items-center ${
          focused ? "border-black" : error ? "border-red-300" : "border-slate-100"
        }`}
      >
        <HugeiconsIcon
          icon={icon}
          size={18}
          color={focused ? "#000" : error ? "#dc2626" : "#9ca3af"}
          strokeWidth={1}
        />
        <TextInput
          className="flex-1 ml-3 text-gray-900 text-base font-medium"
          style={{ outlineStyle: 'none' } as any} // Fixed web outline
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={(t) => {
            onChange(t);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={!isLoading}
        />
        {value.length > 0 && !error && !secure && (
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#10b981" />
        )}
        {right}
      </View>
      {error && (
        <View className="mt-2 flex-row items-center ml-4">
          <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#dc2626" />
          <Text className="text-red-600 text-xs font-medium ml-1.5">{error}</Text>
        </View>
      )}
    </View>
  );

  const isLastStep = step === TOTAL_STEPS - 1;

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
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View className="flex-row items-center mb-10">
          <TouchableOpacity
            onPress={goBack}
            disabled={isLoading}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i <= step ? "#000" : "#e5e7eb",
                }}
              />
            ))}
          </View>
          <View className="w-10" />
        </View>

        {/* ── Heading ── */}
        <View className="mb-8">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            {STEPS[step].title}
          </Text>
          <Text className="text-base text-slate-500">
            {STEPS[step].subtitle}
          </Text>
        </View>

        {/* ── General Error ── */}
        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
            <HugeiconsIcon icon={Alert01Icon} size={20} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-sm">{errors.general}</Text>
          </View>
        )}

        {/* ── Step Content ── */}
        {step === 0 && (
          <>
            <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Full Name</Text>
            <InputRow
              icon={UserIcon}
              placeholder="John Doe"
              value={displayName}
              onChange={(t: string) => { setDisplayName(t); setErrors(p => ({ ...p, displayName: undefined })); }}
              focused={displayNameFocused}
              onFocus={() => setDNF(true)}
              onBlur={() => setDNF(false)}
              error={errors.displayName}
              autoCapitalize="words"
            />
            <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Username</Text>
            <InputRow
              icon={AtSignIcon}
              placeholder="john_doe"
              value={username}
              onChange={(t: string) => { setUsername(t); setErrors(p => ({ ...p, username: undefined })); }}
              focused={usernameFocused}
              onFocus={() => setUNF(true)}
              onBlur={() => setUNF(false)}
              error={errors.username}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Email Address</Text>
            <InputRow
              icon={Mail01Icon}
              placeholder="your.email@example.com"
              value={email}
              onChange={(t: string) => { setEmail(t); setErrors(p => ({ ...p, email: undefined })); }}
              focused={emailFocused}
              onFocus={() => setEF(true)}
              onBlur={() => setEF(false)}
              error={errors.email}
              keyboardType="email-address"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Password</Text>
            <InputRow
              icon={LockPasswordIcon}
              placeholder="At least 6 characters"
              value={password}
              onChange={(t: string) => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); }}
              focused={passwordFocused}
              onFocus={() => setPF(true)}
              onBlur={() => setPF(false)}
              error={errors.password}
              secure={!showPassword}
              right={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={18} color="#6b7280" />
                </TouchableOpacity>
              }
            />
            <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Confirm Password</Text>
            <InputRow
              icon={LockPasswordIcon}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(t: string) => { setConfirmPass(t); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
              focused={confirmFocused}
              onFocus={() => setCF(true)}
              onBlur={() => setCF(false)}
              error={errors.confirmPassword}
              secure={!showConfirm}
              right={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
                  <HugeiconsIcon icon={showConfirm ? ViewOffIcon : ViewIcon} size={18} color="#6b7280" />
                </TouchableOpacity>
              }
            />
          </>
        )}

        {/* ── Buttons ── */}
        <TouchableOpacity
          className="h-14 rounded-full bg-black items-center justify-center mt-2 mb-4"
          onPress={isLastStep ? handleRegister : goNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-base">
                {isLastStep ? "Create account" : "Continue"}
              </Text>
              {!isLastStep && <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="white" />}
            </View>
          )}
        </TouchableOpacity>

        {step === 0 && (
          <View className="mt-4">
            <View className="flex-row items-center gap-3 mb-6">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="text-slate-500 text-xs font-medium">OR</Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </View>
            <View className="flex-row justify-center items-center">
              <Text className="text-slate-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-blue-600 font-bold text-sm">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLastStep && (
          <View className="mt-4 px-4">
            <Text className="text-slate-500 text-xs text-center leading-5">
              By creating an account, you agree to our{" "}
              <Text className="text-blue-600 font-semibold">Terms</Text> and{" "}
              <Text className="text-blue-600 font-semibold">Privacy Policy</Text>.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}