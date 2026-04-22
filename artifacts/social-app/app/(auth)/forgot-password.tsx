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
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForgotPassword } from "@workspace/api-client-react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Mail01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: forgotPassword, isPending } = useForgotPassword({
    mutation: {
      onSuccess: () => {
        setSubmitted(true);
        setError(null);
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || "Something went wrong. Please try again.");
      },
    },
  });

  const handleResetRequest = () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    forgotPassword({ data: { email: email.trim().toLowerCase() } });
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
            Forgot password?
          </Text>
          <Text className="text-base text-slate-500">
            Enter your email and we'll send you a link to reset your password.
          </Text>
        </View>

        {submitted ? (
          <View className="bg-green-50 p-6 rounded-2xl items-center gap-4">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} color="#10b981" />
            <View>
              <Text className="text-green-800 font-bold text-center text-lg mb-1">Check your email</Text>
              <Text className="text-green-700 text-center">
                We've sent password reset instructions to {email}.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/reset-password")}
              className="bg-green-600 px-6 py-3 rounded-full mt-2"
            >
              <Text className="text-white font-bold">I have a token</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {error && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-center gap-3">
                <HugeiconsIcon icon={Alert01Icon} size={20} color="#dc2626" />
                <Text className="flex-1 text-red-700 font-semibold text-sm">{error}</Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-slate-700 font-semibold mb-2 text-sm">Email Address</Text>
              <View className="border border-gray-100 rounded-full px-4 py-3 flex-row items-center bg-gray-50">
                <HugeiconsIcon icon={Mail01Icon} size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base font-medium outline-none"
                  placeholder="your.email@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isPending}
                />
              </View>
            </View>

            <TouchableOpacity
              className="h-14 rounded-full bg-black items-center justify-center"
              onPress={handleResetRequest}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Send reset link</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
