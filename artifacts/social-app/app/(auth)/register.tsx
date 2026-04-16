import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  UserIcon, 
  AtSignIcon, 
  Mail01Icon, 
  LockPasswordIcon, 
  ViewIcon, 
  ViewOffSlashIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  TickCircleIcon,
  InformationCircleIcon,
  AlertCircleIcon
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

const TOTAL_STEPS = 3;

const STEPS = [
  { title: "Who are you?", subtitle: "Let's start with your name and username" },
  { title: "Your email", subtitle: "We'll use this to sign you in" },
  { title: "Secure it", subtitle: "Create a strong password" },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  
  /* ─── form state ─── */
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  /* ─── focus state ─── */
  const [displayNameFocused, setDNF] = useState(false);
  const [usernameFocused, setUNF] = useState(false);
  const [emailFocused, setEF] = useState(false);
  const [passwordFocused, setPF] = useState(false);
  const [confirmFocused, setCF] = useState(false);
  
  const topPt = insets.top + (Platform.OS === "web" ? 24 : 0);
  const bottomPb = insets.bottom + 24;
  
  /* ─── per-step validation ─── */
  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 0) {
      if (!displayName.trim()) newErrors.displayName = "Full name is required";
      else if (displayName.trim().length < 2) newErrors.displayName = "Name must be at least 2 characters";
      
      if (!username.trim()) newErrors.username = "Username is required";
      else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
        newErrors.username = "Letters, numbers, _ and - only";
    }
    
    if (step === 1) {
      if (!email.trim()) newErrors.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        newErrors.email = "Please enter a valid email address";
    }
    
    if (step === 2) {
      if (!password) newErrors.password = "Password is required";
      else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
      
      if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
      else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const goNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
  };
  
  const goBack = () => {
    if (step > 0) { 
        setStep(s => s - 1);
        setErrors({}); 
    }
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
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.message || "Registration failed.";
        if (data.field) setErrors({ [data.field]: msg } as FormErrors);
        else setErrors({ general: msg });
        return;
      }
      await login(data.token, data.user);
    } catch {
      setErrors({ general: "Connection failed." });
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
  }: {
    icon: any;
    placeholder: string;
    value: string;
    onChange: (t: string) => void;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    error?: string;
    secure?: boolean;
    right?: React.ReactNode;
    keyboardType?: any;
    autoCapitalize?: any;
  }) => (
    <View className="mb-5">
      <View
        className={`border rounded-full px-4 py-3 flex-row items-center ${
          focused ? "border-black" : error ? "border-red-300" : "border-gray-100"
        }`}
      >
        <HugeiconsIcon
          icon={icon}
          size={20}
          color={focused ? "#000" : error ? "#dc2626" : "#9ca3af"}
          strokeWidth={1.5}
        />
        <TextInput
          className="flex-1 ml-3 text-gray-900 text-base font-medium"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={(t) => {
            onChange(t);
            if (error) setErrors(prev => ({ ...prev }));
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={!isLoading}
        />
        {value && !error && !secure && (
          <HugeiconsIcon icon={TickCircleIcon} size={18} color="#10b981" />
        )}
        {right}
      </View>
      {error && (
        <View className="mt-2 flex-row items-center gap-1.5 px-1">
          <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#dc2626" />
          <Text className="text-red-600 text-xs font-medium">{error}</Text>
        </View>
      )}
    </View>
  );
  
  const renderStep = () => {
    if (step === 0) return (
      <>
        <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Full Name</Text>
        <InputRow
          icon={UserIcon}
          placeholder="John Doe"
          value={displayName}
          onChange={(t) => { setDisplayName(t); setErrors(p => ({ ...p, displayName: undefined })); }}
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
          onChange={(t) => { setUsername(t); setErrors(p => ({ ...p, username: undefined })); }}
          focused={usernameFocused}
          onFocus={() => setUNF(true)}
          onBlur={() => setUNF(false)}
          error={errors.username}
        />
      </>
    );
    
    if (step === 1) return (
      <>
        <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Email Address</Text>
        <InputRow
          icon={Mail01Icon}
          placeholder="your.email@example.com"
          value={email}
          onChange={(t) => { setEmail(t); setErrors(p => ({ ...p, email: undefined })); }}
          focused={emailFocused}
          onFocus={() => setEF(true)}
          onBlur={() => setEF(false)}
          error={errors.email}
          keyboardType="email-address"
        />
      </>
    );
    
    if (step === 2) return (
      <>
        <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Password</Text>
        <InputRow
          icon={LockPasswordIcon}
          placeholder="At least 6 characters"
          value={password}
          onChange={(t) => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); }}
          focused={passwordFocused}
          onFocus={() => setPF(true)}
          onBlur={() => setPF(false)}
          error={errors.password}
          secure={!showPassword}
          right={
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} disabled={isLoading} className="p-1">
              <HugeiconsIcon
                icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                size={20}
                color={errors.password ? "#dc2626" : "#6b7280"}
              />
            </TouchableOpacity>
          }
        />
        <Text className="text-slate-700 font-semibold mb-2 text-sm ml-1">Confirm Password</Text>
        <InputRow
          icon={LockPasswordIcon}
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(t) => { setConfirmPass(t); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
          focused={confirmFocused}
          onFocus={() => setCF(true)}
          onBlur={() => setCF(false)}
          error={errors.confirmPassword}
          secure={!showConfirm}
          right={
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} disabled={isLoading} className="p-1">
              <HugeiconsIcon
                icon={showConfirm ? ViewOffSlashIcon : ViewIcon}
                size={20}
                color={errors.confirmPassword ? "#dc2626" : "#6b7280"}
              />
            </TouchableOpacity>
          }
        />
      </>
    );
  };
  
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
        <View className="flex-row items-center mb-10">
          <TouchableOpacity
            onPress={goBack}
            disabled={isLoading}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color="#1f2937" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
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

        {errors.general && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-sm">{errors.general}</Text>
          </View>
        )}

        {renderStep()}

        <TouchableOpacity
          className="h-14 rounded-full bg-black items-center justify-center mt-2 mb-4"
          onPress={isLastStep ? handleRegister : goNext}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-base">
                {isLastStep ? "Create account" : "Continue"}
              </Text>
              {!isLastStep && <HugeiconsIcon icon={ArrowRight02Icon} size={20} color="white" />}
            </View>
          )}
        </TouchableOpacity>

        {step === 0 && (
          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-slate-600 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-600 font-bold text-sm">Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}