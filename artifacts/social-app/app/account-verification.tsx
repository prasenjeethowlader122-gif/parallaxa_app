import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRequestVerification, useGetMe } from "@workspace/api-client-react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CheckmarkBadge01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  InformationCircleIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { useColors } from "@/hooks/useColors";

export default function AccountVerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const { data: user, refetch: refetchUser } = useGetMe();
  const [step, setStep] = useState(user?.verificationStatus === 'none' ? 'start' : 'pending');
  const [otp, setOtp] = useState("");
  const [verifyingType, setVerifyingType] = useState<'email' | 'phone' | null>(null);

  const { mutate: requestVerification, isPending: isRequesting } = useRequestVerification({
    mutation: {
      onSuccess: () => {
        setStep('pending');
        refetchUser();
        Alert.alert("Success", "Verification request submitted successfully.");
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.response?.data?.message || "Failed to submit request.");
      }
    }
  });

  const handleRequest = () => {
    requestVerification();
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) return;
    // Mocking OTP verification success
    Alert.alert("Verified", `${verifyingType === 'email' ? 'Email' : 'Phone'} verified successfully!`);
    setStep('start');
    setVerifyingType(null);
    setOtp("");
  };

  if (user?.isVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={64} color="#1d9bf0" />
        <Text style={{ fontSize: 24, fontWeight: '700', marginTop: 16, color: colors.foreground }}>Verified Account</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 8, color: colors.mutedForeground }}>
          Your account is verified. You have access to exclusive features.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100, marginTop: 32 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.muted, marginBottom: 24 }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.foreground, marginBottom: 8 }}>
            Verification
          </Text>
          <Text style={{ fontSize: 16, color: colors.mutedForeground }}>
            Get the blue checkmark and secure your account.
          </Text>
        </View>

        {verifyingType ? (
          <View>
             <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
              Verify your {verifyingType}
            </Text>
            <Text style={{ fontSize: 15, color: colors.mutedForeground, marginBottom: 24 }}>
              Enter the 6-digit code sent to your {verifyingType}. (Demo: Enter any 6 digits)
            </Text>
            <View style={{ borderBottomWidth: 2, borderBottomColor: colors.primary, paddingVertical: 8, marginBottom: 32 }}>
              <TextInput
                style={{ fontSize: 32, fontWeight: '700', textAlign: 'center', color: colors.foreground, letterSpacing: 10 }}
                placeholder="000000"
                placeholderTextColor={colors.muted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={otp.length !== 6}
              style={{ backgroundColor: otp.length === 6 ? '#000' : colors.muted, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: otp.length === 6 ? '#fff' : colors.mutedForeground, fontWeight: '700', fontSize: 16 }}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setVerifyingType(null)} style={{ marginTop: 16 }}>
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : step === 'pending' ? (
          <View style={{ backgroundColor: colors.muted, padding: 24, borderRadius: 24, alignItems: 'center' }}>
             <HugeiconsIcon icon={InformationCircleIcon} size={48} color={colors.primary} />
             <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 16, color: colors.foreground }}>Request Pending</Text>
             <Text style={{ fontSize: 15, textAlign: 'center', marginTop: 8, color: colors.mutedForeground }}>
               Your verification request is currently being reviewed by our team. This usually takes 24-48 hours.
             </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={() => setVerifyingType('email')}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.muted, borderRadius: 20, gap: 16 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8f5fd', alignItems: 'center', justifyContent: 'center' }}>
                <HugeiconsIcon icon={Mail01Icon} size={24} color="#1d9bf0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>Email Verification</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{user?.email}</Text>
              </View>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#10b981" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVerifyingType('phone')}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.muted, borderRadius: 20, gap: 16 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                <HugeiconsIcon icon={SmartPhone01Icon} size={24} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>Phone Verification</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Connect your phone number</Text>
              </View>
              <HugeiconsIcon icon={ArrowLeft01Icon} style={{ transform: [{ rotate: '180deg' }] }} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Verification Request</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, lineHeight: 20 }}>
                Applying for verification requires a complete profile, a confirmed email address, and a phone number.
              </Text>

              <TouchableOpacity
                onPress={handleRequest}
                disabled={isRequesting || user?.verificationStatus === 'pending'}
                style={{
                  backgroundColor: '#000',
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 8,
                  opacity: (isRequesting || user?.verificationStatus === 'pending') ? 0.6 : 1
                }}
              >
                {isRequesting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    Request Verification
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
