import React from "react";
import { Alert, Linking, Platform, TouchableOpacity, View, ScrollView, Switch } from "react-native";
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
  UserBlock01Icon,
  Settings02Icon,
  Moon02Icon,
  Sun03Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemePref } from "@/context/ThemeContext";
import { useUpdateUser, useGetMe } from "@workspace/api-client-react";
import { UserAvatar } from "@/components/UserAvatar";

const APPEARANCE_OPTIONS: { value: ThemePref; label: string; sub: string; icon: any }[] = [
  { value: "system", label: "System default", sub: "Follow device setting", icon: SmartPhone01Icon },
  { value: "light",  label: "Light",          sub: "Always use light mode", icon: Sun03Icon },
  { value: "dark",   label: "Dark",           sub: "Always use dark mode",  icon: Moon02Icon },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { themePref, setThemePref } = useTheme();
  const { data: me, refetch } = useGetMe();
  const updateUser = useUpdateUser();

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const togglePrivate = async (value: boolean) => {
    if (!me) return;
    try {
      await updateUser.mutateAsync({ userId: me.id, data: { isPrivate: value } });
      refetch();
    } catch {
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
    ...(me?.role === "admin"
      ? [{
          title: "Administrative Tools",
          items: [{
            icon: Settings02Icon,
            label: "User Management",
            onPress: () => router.push("/admin/users" as any),
          }],
        }]
      : []),
    {
      title: "Account",
      items: [
        { icon: Edit01Icon, label: "Edit profile", onPress: () => router.push("/edit-profile" as any) },
        { icon: CheckmarkCircle01Icon, label: "Account Verification", onPress: () => router.push("/account-verification" as any) },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Notification01Icon, label: "Push Notifications", onPress: () => { Linking.openSettings(); } },
      ],
    },
    {
      title: "Security & Privacy",
      items: [
        { icon: LockPasswordIcon, label: "Two-Factor Auth", onPress: () => router.push("/two-factor-setup" as any) },
        { icon: Shield01Icon, label: "Private account", isSwitch: true, value: me?.isPrivate ?? false, onValueChange: togglePrivate },
        { icon: UserBlock01Icon, label: "Blocked Users", onPress: () => router.push("/blocked-users" as any) },
      ],
    },
    {
      title: "Support & About",
      items: [
        {
          icon: HelpCircleIcon,
          label: "Help & Support",
          onPress: () => Linking.openURL("mailto:support@parallaxa.com").catch(() => Alert.alert("Help", "Reach us at support@parallaxa.com")),
        },
        {
          icon: InformationCircleIcon,
          label: "About",
          onPress: () => Alert.alert("About Parallaxa", "Version 1.0.0\nBuilt with Expo & React Native\n\n© 2026 Parallaxa"),
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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>
          Settings
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        {me && (
          <TouchableOpacity onPress={() => router.push("/edit-profile" as any)} activeOpacity={0.7}>
            <View
              className="flex-row items-center px-5 py-4 mt-4 mx-4 rounded-2xl gap-4"
              style={{ backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border }}
            >
              <UserAvatar uri={me.avatarUrl} size={58} />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[17px] font-bold" style={{ color: colors.foreground }} numberOfLines={1}>
                    {me.displayName || me.username}
                  </Text>
                  {me.isVerified && (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.verified} />
                  )}
                </View>
                <Text className="text-sm mt-0.5" style={{ color: colors.mutedForeground }}>
                  @{me.username}
                </Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.mutedForeground} strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Appearance Section ── */}
        <View className="mt-6">
          <Text
            className="px-5 mb-2 text-[13px] font-bold uppercase tracking-wider"
            style={{ color: colors.mutedForeground }}
          >
            Appearance
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            {APPEARANCE_OPTIONS.map((opt, index) => {
              const isSelected = themePref === opt.value;
              return (
                <View key={opt.value}>
                  <TouchableOpacity
                    className="flex-row items-center px-5 py-4 gap-3.5"
                    onPress={() => setThemePref(opt.value)}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon
                      icon={opt.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.foreground}
                      strokeWidth={1.5}
                    />
                    <View className="flex-1">
                      <Text
                        className="text-base"
                        style={{ color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? "600" : "400" }}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                        {opt.sub}
                      </Text>
                    </View>
                    {isSelected && (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                  {index < APPEARANCE_OPTIONS.length - 1 && (
                    <View className="ml-14" style={{ height: 0.5, backgroundColor: colors.border }} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Other Sections ── */}
        {sections.map((section) => (
          <View key={section.title} className="mt-6">
            <Text
              className="px-5 mb-2 text-[13px] font-bold uppercase tracking-wider"
              style={{ color: colors.mutedForeground }}
            >
              {section.title}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopWidth: 0.5,
                borderBottomWidth: 0.5,
                borderColor: colors.border,
              }}
            >
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    className="flex-row items-center px-5 py-4 gap-3.5"
                    onPress={item.onPress}
                    disabled={(item as any).isSwitch}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={20}
                      color={
                        (item as any).isSwitch && (item as any).value
                          ? colors.primary
                          : colors.foreground
                      }
                      strokeWidth={1.5}
                    />
                    <Text className="flex-1 text-base" style={{ color: colors.foreground }}>
                      {item.label}
                    </Text>
                    {(item as any).isSwitch ? (
                      <Switch
                        value={(item as any).value}
                        onValueChange={(item as any).onValueChange}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={Platform.OS === "ios" ? undefined : colors.background}
                      />
                    ) : (
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.mutedForeground} strokeWidth={1.5} />
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

        {/* Log out */}
        <View className="mt-8 mb-10">
          <TouchableOpacity
            className="flex-row items-center px-5 py-4 gap-3.5"
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <HugeiconsIcon icon={Logout01Icon} size={20} color={colors.destructive} strokeWidth={1.5} />
            <Text className="flex-1 text-base font-semibold" style={{ color: colors.destructive }}>
              Log out
            </Text>
          </TouchableOpacity>
          <Text className="text-center mt-4 text-[13px]" style={{ color: colors.mutedForeground }}>
            Parallaxa v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
