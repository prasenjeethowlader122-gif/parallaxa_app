import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResetPassword } from "@workspace/api-client-react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  LockPasswordIcon,
  Alert01Icon,
  ViewIcon,
  ViewOffIcon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: resetPassword, isPending } = useResetPassword({
    mutation: {
      onSuccess: () => {
        Alert.alert(
          "Success",
          "Your password has been reset successfully.",
          [{ text: "Login", onPress: () => router.replace("/(auth)/login") }]
        );
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || "Invalid or expired token.");
      },
    },
  });

  const handleReset = () => {
    if (!token.trim()) {
      setError("Please enter the reset token");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    resetPassword({ data: { token: token.trim(), password } });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-8"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#1f2937" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            Reset password
          </Text>
          <Text className="text-base text-slate-500">
            Enter the token from your email and your new password.
          </Text>
        </View>

        {error && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
            <HugeiconsIcon icon={Alert01Icon} size={20} color="#dc2626" />
            <Text className="flex-1 text-red-700 font-semibold text-sm">{error}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">Reset Token</Text>
          <View className="border border-gray-100 rounded-full px-4 py-3 flex-row items-center bg-gray-50">
            <HugeiconsIcon icon={Ticket01Icon} size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base font-medium outline-none"
              placeholder="Enter token"
              placeholderTextColor="#9ca3af"
              value={token}
              onChangeText={(t) => {
                setToken(t);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isPending}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-slate-700 font-semibold mb-2 text-sm">New Password</Text>
          <View className="border border-gray-100 rounded-full px-4 py-3 flex-row items-center bg-gray-50">
            <HugeiconsIcon icon={LockPasswordIcon} size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base font-medium outline-none"
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              editable={!isPending}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className="h-14 rounded-full bg-black items-center justify-center"
          onPress={handleReset}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Update password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
