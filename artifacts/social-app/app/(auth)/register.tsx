import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const topPt = insets.top + (Platform.OS === "web" ? 67 : 0) + 20;
  const bottomPb = insets.bottom + 40;

  const fields = [
    { icon: "user" as const, placeholder: "Full name", value: displayName, setter: setDisplayName, autoCapitalize: "words" as const },
    { icon: "at-sign" as const, placeholder: "Username", value: username, setter: setUsername, autoCapitalize: "none" as const },
    { icon: "mail" as const, placeholder: "Email", value: email, setter: setEmail, autoCapitalize: "none" as const, keyboard: "email-address" as const },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingTop: topPt, paddingBottom: bottomPb }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-[28px] font-bold mb-1.5" style={{ color: colors.foreground }}>
            Create account
          </Text>
          <Text className="text-[15px]" style={{ color: colors.mutedForeground }}>
            Join Pulse today
          </Text>
        </View>

        <View className="gap-3">
          {fields.map(({ icon, placeholder, value, setter, autoCapitalize, keyboard }) => (
            <View
              key={placeholder}
              className="flex-row items-center border rounded-xl px-3.5 h-[50px] gap-2.5"
              style={{ borderColor: colors.border, backgroundColor: colors.input }}
            >
              <Feather name={icon} size={18} color={colors.mutedForeground} />
              <TextInput
                className="flex-1 text-[15px]"
                style={{ color: colors.foreground }}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={value}
                onChangeText={setter}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboard}
                autoCorrect={false}
              />
            </View>
          ))}

          <View
            className="flex-row items-center border rounded-xl px-3.5 h-[50px] gap-2.5"
            style={{ borderColor: colors.border, backgroundColor: colors.input }}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 text-[15px]"
              style={{ color: colors.foreground }}
              placeholder="Password (min 6 chars)"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="h-[50px] rounded-xl bg-primary items-center justify-center mt-2"
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white">Create account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-8">
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm font-bold text-primary"> Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
