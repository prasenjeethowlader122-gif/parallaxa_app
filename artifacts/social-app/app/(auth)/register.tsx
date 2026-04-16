import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const X = {
  bg: "#000000",
  surface: "#16181C",
  border: "#2F3336",
  accent: "#1D9BF0",
  white: "#E7E9EA",
  muted: "#71767B",
  inputBg: "#000000",
};

type FloatingInputProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
};

function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = "none",
  secureTextEntry = false,
  rightElement,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: focused ? X.accent : X.border,
        borderRadius: 4,
        backgroundColor: X.inputBg,
        height: 56,
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 14,
        paddingBottom: 10,
        position: "relative",
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          position: "absolute",
          left: 14,
          top: lifted ? 6 : 17,
          fontSize: lifted ? 11 : 15,
          color: focused ? X.accent : X.muted,
          fontWeight: "400",
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          flex: 1,
          color: X.white,
          fontSize: 17,
          marginTop: 14,
          outlineStyle: "none",
        } as any}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
      {rightElement}
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
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
        Alert.alert("Registration Failed", data.message ?? "Could not create account");
        return;
      }
      await login(data.token, data.user);
    } catch {
      Alert.alert("Error", "Could not connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPb = insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: X.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 40,
          paddingTop: topPt + 16,
          paddingBottom: bottomPb,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header row: back + X logo */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 36,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
            }}
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color={X.white} />
          </TouchableOpacity>

          {/* X Logo centered */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: X.white,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            ✕
          </Text>

          {/* Spacer to balance the back button */}
          <View style={{ width: 36 }} />
        </View>

        {/* Heading */}
        <Text
          style={{
            fontSize: 31,
            fontWeight: "800",
            color: X.white,
            marginBottom: 8,
            letterSpacing: -0.5,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          Create your account
        </Text>
        <Text style={{ color: X.muted, fontSize: 15, marginBottom: 32 }}>
          Step 1 of 1
        </Text>

        {/* Fields */}
        <FloatingInput
          label="Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <FloatingInput
          label="Username"
          value={username}
          onChangeText={setUsername}
        />

        <FloatingInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <FloatingInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ paddingLeft: 8, paddingBottom: 2 }}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={X.muted} />
            </TouchableOpacity>
          }
        />

        {/* Terms note */}
        <Text style={{ color: X.muted, fontSize: 13, lineHeight: 18, marginBottom: 32 }}>
          By signing up, you agree to the{" "}
          <Text style={{ color: X.accent }}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={{ color: X.accent }}>Privacy Policy</Text>
          , including{" "}
          <Text style={{ color: X.accent }}>Cookie Use</Text>.
          X may use your contact information, including your email address and phone number for
          purposes outlined in our Privacy Policy.{" "}
          <Text style={{ color: X.accent }}>Learn more</Text>
        </Text>

        {/* Create account button */}
        <TouchableOpacity
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: X.white,
            alignItems: "center",
            justifyContent: "center",
            opacity: isLoading ? 0.8 : 1,
          }}
          onPress={handleRegister}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={X.bg} />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "700", color: X.bg, letterSpacing: 0.1 }}>
              Create account
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
          <Text style={{ color: X.muted, fontSize: 15 }}>Have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: X.accent, fontSize: 15, fontWeight: "700" }}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}