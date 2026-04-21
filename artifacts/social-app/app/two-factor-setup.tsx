import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, CheckmarkCircle01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import {
  useSetup2FA,
  useEnable2FA,
  useDisable2FA,
  useGetMe,
} from "@/lib/api-client-react/src/generated/api";

export default function TwoFactorSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: me, refetch } = useGetMe();

  const [setupData, setSetupData] = useState<{ qrCodeUri: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();

  useEffect(() => {
    if (me && !me.twoFactorEnabled) {
      handleSetup();
    }
  }, [me]);

  const handleSetup = async () => {
    try {
      const data = await setup2FA.mutateAsync({});
      setSetupData(data);
    } catch (err) {
      Alert.alert("Error", "Failed to start 2FA setup");
    }
  };

  const handleEnable = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await enable2FA.mutateAsync({ data: { code } });
      Alert.alert("Success", "Two-factor authentication enabled");
      refetch();
    } catch (err) {
      Alert.alert("Error", "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter your 6-digit code to disable 2FA");
      return;
    }
    setLoading(true);
    try {
      await disable2FA.mutateAsync({ data: { code } });
      Alert.alert("Success", "Two-factor authentication disabled");
      refetch();
      setCode("");
    } catch (err) {
      Alert.alert("Error", "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center px-4 pb-3"
        style={{
          paddingTop: insets.top + 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="ml-4 text-[17px] font-bold" style={{ color: colors.foreground }}>
          Two-Factor Authentication
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {me?.twoFactorEnabled ? (
          <View className="items-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={64} color={colors.primary} />
            <Text className="mt-4 text-xl font-bold text-center" style={{ color: colors.foreground }}>
              2FA is Enabled
            </Text>
            <Text className="mt-2 text-center" style={{ color: colors.mutedForeground }}>
              Your account is extra secure. To disable it, enter a 6-digit code from your app below.
            </Text>

            <TextInput
              className="w-full mt-8 p-4 rounded-xl text-center text-2xl font-bold tracking-[10px]"
              style={{
                backgroundColor: colors.secondary,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              className="w-full mt-6 p-4 rounded-xl items-center"
              style={{ backgroundColor: colors.destructive }}
              onPress={handleDisable}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Disable 2FA</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text className="text-base" style={{ color: colors.foreground }}>
              1. Scan this QR code with an authenticator app (like Google Authenticator or Authy).
            </Text>

            {setupData ? (
              <View className="items-center my-8">
                <Image
                  source={{ uri: setupData.qrCodeUri }}
                  style={{ width: 200, height: 200, backgroundColor: "white" }}
                />
                <Text className="mt-4 font-mono text-sm" style={{ color: colors.mutedForeground }}>
                  {setupData.secret}
                </Text>
              </View>
            ) : (
              <ActivityIndicator className="my-12" color={colors.primary} />
            )}

            <Text className="text-base" style={{ color: colors.foreground }}>
              2. Enter the 6-digit code from the app to verify.
            </Text>

            <TextInput
              className="w-full mt-6 p-4 rounded-xl text-center text-2xl font-bold tracking-[10px]"
              style={{
                backgroundColor: colors.secondary,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              className="w-full mt-6 p-4 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleEnable}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Enable 2FA</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
