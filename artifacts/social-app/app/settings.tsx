import React from "react";
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Edit01Icon,
  Bell01Icon,
  Lock01Icon,
  Shield01Icon,
  HelpCircle01Icon,
  InformationCircleIcon,
  LogOut02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: async () => { await logout(); } },
    ]);
  };

  const options = [
    {
      icon: Edit01Icon,
      label: "Edit profile",
      onPress: () => router.push("/edit-profile" as any),
    },
    {
      icon: Bell01Icon,
      label: "Notifications",
      onPress: () => {}, // add route or modal if needed
    },
    {
      icon: Lock01Icon,
      label: "Privacy",
      onPress: () => {},
    },
    {
      icon: Shield01Icon,
      label: "Security",
      onPress: () => {},
    },
    {
      icon: HelpCircle01Icon,
      label: "Help",
      onPress: () => {},
    },
    {
      icon: InformationCircleIcon,
      label: "About",
      onPress: () => {},
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
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

      {/* Settings list */}
      <View className="mt-2">
        {options.map(({ icon, label, onPress }) => (
          <TouchableOpacity
            key={label}
            className="flex-row items-center px-5 py-4 gap-3.5"
            style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={icon}
              size={20}
              color={colors.foreground}
              strokeWidth={1.5}
            />
            <Text className="flex-1 text-base" style={{ color: colors.foreground }}>
              {label}
            </Text>
            <HugeiconsIcon
              icon={ArrowRight01Icon ?? ArrowLeft01Icon} // change if you have a right‑arrow icon
              size={18}
              color={colors.mutedForeground}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="flex-row items-center px-5 py-4 gap-3.5"
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={LogOut02Icon}
            size={20}
            color={colors.destructive}
            strokeWidth={1.5}
          />
          <Text className="flex-1 text-base" style={{ color: colors.destructive }}>
            Log out
          </Text>
          <View style={{ width: 18 }} /> {/* placeholder; remove if you want chevron */}
        </TouchableOpacity>
      </View>
    </View>
  );
}
