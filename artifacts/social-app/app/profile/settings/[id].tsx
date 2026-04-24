import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetUser,
  useFreezeUser,
  useUnfreezeUser,
  useApproveVerification
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Flag01Icon,
  UnavailableIcon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export default function ProfileSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: me } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: profile, refetch } = useGetUser(id ?? "");

  const { mutate: freezeUser } = useFreezeUser({
    mutation: { onSuccess: () => { Alert.alert("Success", "User frozen"); refetch(); } }
  });
  const { mutate: unfreezeUser } = useUnfreezeUser({
    mutation: { onSuccess: () => { Alert.alert("Success", "User unfrozen"); refetch(); } }
  });
  const { mutate: approveVerification } = useApproveVerification({
    mutation: { onSuccess: () => { Alert.alert("Success", "Verification approved"); refetch(); } }
  });

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const sections = [
    {
      title: "User Actions",
      items: [
        {
          icon: Flag01Icon,
          label: "Report @"+profile?.username,
          onPress: () => Alert.alert("Report", "Thank you for reporting. We will review this account."),
          destructive: true,
        },
        {
          icon: UnavailableIcon,
          label: "Block @"+profile?.username,
          onPress: () => Alert.alert("Block", "You have blocked this user."),
          destructive: true,
        },
      ],
    },
    ...(me?.role === 'admin' ? [{
      title: "Administrative Tools",
      items: [
        {
          icon: Shield01Icon,
          label: profile?.isFrozen ? "Unfreeze Account" : "Freeze Account",
          onPress: () => profile?.isFrozen ? unfreezeUser({ userId: id! }) : freezeUser({ userId: id! }),
          destructive: !profile?.isFrozen,
        },
        ...(profile?.verificationStatus === 'pending' ? [{
          icon: CheckmarkCircle01Icon,
          label: "Approve Verification",
          onPress: () => approveVerification({ userId: id! }),
        }] : []),
      ],
    }] : []),
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-3"
        style={{
          paddingTop: topPadding,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <View className="ml-3">
          <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>
            Options
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {sections.map((section) => (
          <View key={section.title} className="mt-6">
            <Text
              className="px-5 mb-2 text-[13px] font-bold uppercase tracking-wider"
              style={{ color: colors.mutedForeground }}
            >
              {section.title}
            </Text>
            <View className="mx-4 overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    className="flex-row items-center px-5 py-4 gap-3.5"
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={20}
                      color={item.destructive ? colors.destructive : colors.foreground}
                      strokeWidth={1.5}
                    />
                    <Text
                      className="flex-1 text-base"
                      style={{ color: item.destructive ? colors.destructive : colors.foreground }}
                    >
                      {item.label}
                    </Text>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={18}
                      color={colors.mutedForeground}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View className="ml-14" style={{ height: 0.2, backgroundColor: colors.border, opacity: 0.5 }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
