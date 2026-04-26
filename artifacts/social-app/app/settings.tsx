import React from "react";
import { Alert, Platform, TouchableOpacity, View, ScrollView } from "react-native";
import { Text } from "@/components/Text";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Edit01Icon,
  Notification01Icon,
  LockPasswordIcon,
  Shield01Icon,
  HelpCircleIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Logout01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useUpdateUser, useGetMe } from "@workspace/api-client-react";
import { Switch } from "react-native";
import SocialNative from "@/modules/social-native";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: me, refetch } = useGetMe();
  const updateUser = useUpdateUser();

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const togglePrivate = async (value: boolean) => {
    if (!me) return;
    try {
      await updateUser.mutateAsync({
        userId: me.id,
        data: { isPrivate: value },
      });
      refetch();
    } catch (err) {
      Alert.alert("Error", "Failed to update privacy settings");
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: async () => { await logout(); } },
    ]);
  };

  const sections = [
    ...(me?.role === 'admin' ? [{
      title: "Administrative Tools",
      items: [
        {
          icon: Shield01Icon,
          label: "User Management",
          onPress: () => Alert.alert("Admin", "User Management coming soon"),
        },
      ],
    }] : []),
    {
      title: "Account",
      items: [
        {
          icon: Edit01Icon,
          label: "Edit profile",
          onPress: () => router.push("/edit-profile" as any),
        },
        {
          icon: CheckmarkCircle01Icon,
          label: "Account Verification",
          onPress: () => router.push("/account-verification" as any),
        },
      ],
    },
    {
      title: "Security & Privacy",
      items: [
        {
          icon: LockPasswordIcon,
          label: "Two-Factor Auth",
          onPress: () => router.push("/two-factor-setup" as any),
        },
        {
          icon: Shield01Icon,
          label: "Private account",
          isSwitch: true,
          value: me?.isPrivate ?? false,
          onValueChange: togglePrivate,
        },
      ],
    },
    {
      title: "Support & About",
      items: [
        {
          icon: HelpCircleIcon,
          label: "Help",
          onPress: () => {},
        },
        {
          icon: InformationCircleIcon,
          label: "About",
          onPress: () => {
             try {
                if (SocialNative) {
                  const greeting = SocialNative.getGreeting();
                  Alert.alert("Native Module Info", greeting);
                } else {
                  Alert.alert("Error", "Native module not available (not on Android APK)");
                }
             } catch(e) {
                Alert.alert("Error", "Native module error");
             }
          },
        },
      ],
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 pb-3"
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
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>
          Settings
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView className="flex-1">
        {sections.map((section, sectionIdx) => (
          <View key={section.title} className="mt-6">
            <Text
              className="px-5 mb-2 text-[13px] font-bold uppercase tracking-wider"
              style={{ color: colors.mutedForeground }}
            >
              {section.title}
            </Text>
            <View style={{ backgroundColor: colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.border }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    className="flex-row items-center px-5 py-4 gap-3.5"
                    onPress={item.onPress}
                    disabled={item.isSwitch}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={20}
                      color={item.isSwitch && item.value ? colors.primary : colors.foreground}
                      strokeWidth={1.5}
                    />
                    <Text className="flex-1 text-base" style={{ color: colors.foreground }}>
                      {item.label}
                    </Text>
                    {item.isSwitch ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={Platform.OS === "ios" ? undefined : colors.background}
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={18}
                        color={colors.mutedForeground}
                        strokeWidth={1.5}
                      />
                    )}
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View className="ml-14" style={{ height: 0.5, backgroundColor: colors.border }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className="mt-8 mb-10">
          <TouchableOpacity
            className="flex-row items-center px-5 py-4 gap-3.5"
            style={{ backgroundColor: colors.card, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.border }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={Logout01Icon}
              size={20}
              color={colors.destructive}
              strokeWidth={1.5}
            />
            <Text className="flex-1 text-base font-semibold" style={{ color: colors.destructive }}>
              Log out
            </Text>
          </TouchableOpacity>
          <Text className="text-center mt-4 text-[13px]" style={{ color: colors.mutedForeground }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
