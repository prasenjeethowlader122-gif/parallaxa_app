import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
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
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Alert01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AtIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  LockPasswordIcon,
  Mail01Icon,
  SmartPhone01Icon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
  Calendar01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { useCheckUsername, useSuggestUsernames } from "@workspace/api-client-react";

type FormErrors = {
  displayName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const TOTAL_STEPS = 5;

const STEPS = [
  { title: "Who are you?", subtitle: "Let's start with your full name" },
  { title: "Your birthday", subtitle: "You must be at least 18 years old" },
  { title: "Contact info", subtitle: "Enter your email or phone number" },
  { title: "Secure it", subtitle: "Create a strong password" },
  { title: "Username", subtitle: "Pick a unique username for your profile" },
];

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
  isLoading,
  clearError,
}: {
  icon: any; // Accepts the icon object from @hugeicons/core-free-icons
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
  isLoading?: boolean;
  clearError: () => void;
}) => (
  <View className="mb-5">
    <View
      className={`border rounded-full px-4 py-3 flex-row items-center ${
        focused
          ? "border-black"
          : error
          ? "border-red-300"
          : "border-gray-100"
      }`}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        color={focused ? "#000" : error ? "#dc2626" : "#9ca3af"}
      />
      <TextInput
        className="flex-1 ml-3 text-gray-900 text-base font-medium outline-none"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={(t) => {
          onChange(t);
          if (error) clearError();
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={!isLoading}
      />
      {isLoading ? (
        <ActivityIndicator size="small" color="#9ca3af" />
      ) : (
        value && !error && !secure && (
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#10b981" />
        )
      )}
      {right}
    </View>
    {error && (
      <View className="mt-2 flex-row items-center gap-1.5">
        <HugeiconsIcon icon={InformationCircleIcon} size={14} color="#dc2626" />
        <Text className="text-red-600 text-xs font-medium">{error}</Text>
      </View>
    )}
  </View>
);

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, setIsProcessing, setProcessingMessage } = useAuth();
  
  /* ─── form state ─── */
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  /* ─── focus state ─── */
  const [displayNameFocused, setDNF] = useState(false);
  const [usernameFocused, setUNF] = useState(false);
  const [dobFocused, setDOBF] = useState(false);
  const [emailFocused, setEF] = useState(false);
  const [phoneFocused, setPhoneF] = useState(false);
  const [passwordFocused, setPF] = useState(false);

  /* ─── Live Username Check ─── */
  const { data: availability, isLoading: isCheckingUsername } = useCheckUsername(
    { username: username.trim().toLowerCase() },
    { query: { enabled: step === 4 && username.trim().length >= 3 } as any }
  );

  const { data: suggestionData } = useSuggestUsernames(
    { username: username.trim().toLowerCase() },
    { query: { enabled: (step === 4 && availability?.available === false) || (step === 4 && username.trim().length === 0) } as any }
  );
  
  const topPt = insets.top + (Platform.OS === "web" ? 24 : 0);
  const bottomPb = insets.bottom + 24;
  
  /* ─── per-step validation ─── */
  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 0) {
      if (!displayName.trim()) newErrors.displayName = "Full name is required";
      else if (displayName.trim().length < 2) newErrors.displayName = "Name must be at least 2 characters";
      else if (displayName.trim().length > 50) newErrors.displayName =
        "Name must be less than 50 characters";
    }

    if (step === 1) {
      if (!dateOfBirth.trim()) {
        newErrors.dateOfBirth = "Date of birth is required";
      } else {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          newErrors.dateOfBirth = "Invalid date format (YYYY-MM-DD)";
        } else {
          const age = new Date().getFullYear() - dob.getFullYear();
          if (age < 18) newErrors.dateOfBirth = "You must be at least 18 years old";
        }
      }
    }

    if (step === 2) {
      if (usePhone) {
        if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
        else if (phoneNumber.trim().length < 8) newErrors.phoneNumber = "Please enter a valid phone number";
      } else {
        if (!email.trim()) newErrors.email = "Email address is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
          newErrors.email = "Please enter a valid email address";
      }
    }
    
    if (step === 3) {
      if (!password) newErrors.password = "Password is required";
      else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
      else if (password.length > 128) newErrors.password = "Password must be less than 128 characters";
    }

    if (step === 4) {
      if (!username.trim()) newErrors.username = "Username is required";
      else if (username.trim().length < 3) newErrors.username = "Username must be at least 3 characters";
      else if (username.trim().length > 30) newErrors.username = "Username must be less than 30 characters";
      else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
        newErrors.username = "Letters, numbers, _ and - only";
      else if (availability?.available === false)
        newErrors.username = "Username is already taken";

      if (!acceptTerms) newErrors.general = "You must accept the terms to continue";
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
    setIsProcessing(true);
    setProcessingMessage("Creating account...");
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          email: usePhone ? undefined : email.trim().toLowerCase(),
          phoneNumber: usePhone ? phoneNumber.trim() : undefined,
          password,
          dateOfBirth,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.message || "Registration failed. Please try again.";
        if (data.field) setErrors({
          [data.field]: msg } as FormErrors);
        else setErrors({ general: msg });
        return;
      }
      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch {
      setErrors({ general: "Connection failed. Check your internet and try again." });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };
  
  
  /* ─── step content ─── */
  const renderStep = () => {
    if (step === 0) return (
      <>
        {/* Full Name */}
        <View className="mb-2">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">Full Name</Text>
          <InputRow
            icon={UserIcon}
            placeholder="John Doe"
            value={displayName}
            onChange={setDisplayName}
            focused={displayNameFocused}
            onFocus={() => setDNF(true)}
            onBlur={() => setDNF(false)}
            error={errors.displayName}
            autoCapitalize="words"
            isLoading={isLoading}
            clearError={() => setErrors(p => ({ ...p, displayName: undefined }))}
          />
        </View>
      </>
    );

    if (step === 1) return (
      <View className="mb-2">
        <Text className="text-slate-700 font-semibold mb-2 text-sm">Birthday</Text>
        <InputRow
          icon={Calendar01Icon}
          placeholder="YYYY-MM-DD"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          focused={dobFocused}
          onFocus={() => setDOBF(true)}
          onBlur={() => setDOBF(false)}
          error={errors.dateOfBirth}
          keyboardType="numbers-and-punctuation"
          isLoading={isLoading}
          clearError={() => setErrors(p => ({ ...p, dateOfBirth: undefined }))}
        />
        <Text className="text-xs text-slate-400 mt-1 ml-1">
          This will not be shown publicly. You must be at least 18.
        </Text>
      </View>
    );

    if (step === 2) return (
      <View className="mb-2">
        <Text className="text-slate-700 font-semibold mb-2 text-sm">
          {usePhone ? "Phone Number" : "Email Address"}
        </Text>
        {usePhone ? (
          <InputRow
            icon={SmartPhone01Icon}
            placeholder="+1 234 567 8900"
            value={phoneNumber}
            onChange={setPhoneNumber}
            focused={phoneFocused}
            onFocus={() => setPhoneF(true)}
            onBlur={() => setPhoneF(false)}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            isLoading={isLoading}
            clearError={() => setErrors(p => ({ ...p, phoneNumber: undefined }))}
          />
        ) : (
          <InputRow
            icon={Mail01Icon}
            placeholder="your.email@example.com"
            value={email}
            onChange={setEmail}
            focused={emailFocused}
            onFocus={() => setEF(true)}
            onBlur={() => setEF(false)}
            error={errors.email}
            keyboardType="email-address"
            isLoading={isLoading}
            clearError={() => setErrors(p => ({ ...p, email: undefined }))}
          />
        )}
        <TouchableOpacity
          onPress={() => setUsePhone(!usePhone)}
          className="mt-2"
        >
          <Text className="text-blue-600 font-semibold text-sm">
            Use {usePhone ? "email" : "phone number"} instead
          </Text>
        </TouchableOpacity>
      </View>
    );
    
    if (step === 3) return (
      <>
        <View className="mb-2">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">Password</Text>
          <InputRow
            icon={LockPasswordIcon}
            placeholder="At least 6 characters"
            value={password}
            onChange={setPassword}
            focused={passwordFocused}
            onFocus={() => setPF(true)}
            onBlur={() => setPF(false)}
            error={errors.password}
            secure={!showPassword}
            isLoading={isLoading}
            clearError={() => setErrors(p => ({ ...p, password: undefined }))}
            right={
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} disabled={isLoading} className="p-1">
                <HugeiconsIcon 
                  icon={showPassword ? ViewOffIcon : ViewIcon} 
                  size={18} 
                  color={errors.password ? "#dc2626" : "#6b7280"} 
                />
              </TouchableOpacity>
            }
          />
        </View>

      </>
    );

    if (step === 4) return (
      <>
        {/* Username */}
        <View className="mb-2">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">Username</Text>
          <InputRow
            icon={AtIcon}
            placeholder="john_doe"
            value={username}
            onChange={setUsername}
            focused={usernameFocused}
            onFocus={() => setUNF(true)}
            onBlur={() => setUNF(false)}
            error={errors.username}
            isLoading={isLoading || isCheckingUsername}
            clearError={() => setErrors(p => ({ ...p, username: undefined }))}
          />
        </View>

        {/* Username Suggestions */}
        {suggestionData?.suggestions && (
          <View className="mb-4 -mt-2">
            <Text className="text-xs text-slate-500 mb-2 ml-1">
              {availability?.available === false ? "Username taken. Try these:" : "Suggested for you:"}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {suggestionData.suggestions.map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setUsername(s)}
                  className="bg-slate-100 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-blue-600 text-xs font-bold">@{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
          paddingTop: topPt + 16,
          paddingBottom: bottomPb,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <View className="items-center mb-8">
          <Image
            source={require('@/assets/images/text-logo-dark.svg')}
            style={{ width: 240, height: 54 }}
            contentFit="contain"
          />
        </View>

        {/* ── Top bar ── */}
        <View className="flex-row items-center mb-10">
          <TouchableOpacity
            onPress={goBack}
            disabled={isLoading}
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#1f2937" />
          </TouchableOpacity>

          {/* Step dots */}
          <View className="flex-1 flex-row items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === step ? "#000" : i < step ? "#000" : "#e5e7eb",
                }}
              />
            ))}
          </View>

          {/* Spacer to balance back button */}
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

        {/* ── Step Fields ── */}
        {renderStep()}

        {/* ── Terms Acceptance (Last Step) ── */}
        {isLastStep && (
          <TouchableOpacity
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 mb-6 px-1"
          >
            <View className={`w-5 h-5 rounded border items-center justify-center ${acceptTerms ? 'bg-black border-black' : 'border-slate-300'}`}>
              {acceptTerms && <HugeiconsIcon icon={Tick01Icon} size={14} color="#fff" strokeWidth={3} />}
            </View>
            <Text className="flex-1 text-slate-600 text-sm">
              I agree to the <Text className="text-blue-600 font-semibold">Terms of Service</Text> and <Text className="text-blue-600 font-semibold">Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>
        )}

        {/* ── CTA Button ── */}
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center mt-2 mb-4 ${
            (isLastStep && !acceptTerms) || isLoading ? 'bg-slate-300' : 'bg-black'
          }`}
          onPress={isLastStep ? handleRegister : goNext}
          disabled={isLoading || (isLastStep && !acceptTerms)}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-base">
                {isLastStep ? "Create account" : "Continue"}
              </Text>
              {!isLastStep && <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ffffff" />}
            </View>
          )}
        </TouchableOpacity>

        {/* ── Divider & sign in ── */}
        {step === 0 && (
          <>
            <View className="flex-row items-center gap-3 my-4">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="text-slate-500 text-xs font-medium">OR</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <View className="flex-row justify-center items-center">
              <Text className="text-slate-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
                <Text className="text-blue-600 font-bold text-sm">Sign in</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Terms (last step) ── */}
        {isLastStep && (
          <View className="mt-4 items-center">
            <Text className="text-slate-500 text-xs text-center leading-5">
              By creating an account, you agree to our{" "}
              <Text className="text-blue-600 font-semibold">Terms of Service</Text>
              {" "}and{" "}
              <Text className="text-blue-600 font-semibold">Privacy Policy</Text>
              {", including "}
              <Text className="text-blue-600 font-semibold">Cookie Use</Text>.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
