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

// X/Twitter color tokens
const X = {
  bg: "#000000",
  surface: "#16181C",
  border: "#2F3336",
  accent: "#1D9BF0",
  white: "#E7E9EA",
  muted: "#71767B",
  inputBg: "#000000",
};

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
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
        Alert.alert("Login Failed", data.message ?? "Invalid credentials");
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
          paddingTop: topPt + 24,
          paddingBottom: bottomPb,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* X Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          {/* X SVG-style logo using text */}
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: X.white,
              letterSpacing: -1,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            ✕
          </Text>
        </View>

        {/* Heading */}
        <Text
          style={{
            fontSize: 31,
            fontWeight: "800",
            color: X.white,
            marginBottom: 32,
            letterSpacing: -0.5,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          Sign in to X
        </Text>

        {/* Floating label email input */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: emailFocused ? X.accent : X.border,
              borderRadius: 4,
              backgroundColor: X.inputBg,
              height: 56,
              justifyContent: "center",
              paddingHorizontal: 14,
              position: "relative",
            }}
          >
            <Text
              style={{
                position: "absolute",
                left: 14,
                top: emailFocused || email.length > 0 ? 6 : 17,
                fontSize: emailFocused || email.length > 0 ? 11 : 15,
                color: emailFocused ? X.accent : X.muted,
                fontWeight: "400",
              }}
            >
              Phone, email, or username
            </Text>
            <TextInput
              style={{
                color: X.white,
                fontSize: 17,
                marginTop: 14,
                outlineStyle: "none",
              }}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Floating label password input */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: passwordFocused ? X.accent : X.border,
              borderRadius: 4,
              backgroundColor: X.inputBg,
              height: 56,
              flexDirection: "row",
              alignItems: "flex-end",
              paddingHorizontal: 14,
              paddingBottom: 10,
              position: "relative",
            }}
          >
            <Text
              style={{
                position: "absolute",
                left: 14,
                top: passwordFocused || password.length > 0 ? 6 : 17,
                fontSize: passwordFocused || password.length > 0 ? 11 : 15,
                color: passwordFocused ? X.accent : X.muted,
                fontWeight: "400",
              }}
            >
              Password
            </Text>
            <TextInput
              style={{
                flex: 1,
                color: X.white,
                fontSize: 17,
                marginTop: 14,
                outlineStyle: "none",
              }}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingLeft: 8 }}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={X.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 28 }}>
          <Text style={{ color: X.accent, fontSize: 14, fontWeight: "600" }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Sign in button */}
        <TouchableOpacity
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: X.white,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            opacity: isLoading ? 0.8 : 1,
          }}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={X.bg} />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "700", color: X.bg, letterSpacing: 0.1 }}>
              Sign in
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: X.border }} />
          <Text style={{ color: X.muted, fontSize: 13, fontWeight: "500" }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: X.border }} />
        </View>

        {/* Sign up CTA */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 }}>
          <Text style={{ color: X.muted, fontSize: 15 }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={{ color: X.accent, fontSize: 15, fontWeight: "700" }}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ marginTop: "auto", paddingTop: 48, alignItems: "center" }}>
          <Text style={{ color: X.muted, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            By signing in, you agree to our{" "}
            <Text style={{ color: X.accent }}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={{ color: X.accent }}>Privacy Policy</Text>
            , including{" "}
            <Text style={{ color: X.accent }}>Cookie Use</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}