import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConversation } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Notification01Icon,
  Delete02Icon,
  UnavailableIcon,
  Flag01Icon,
} from "@hugeicons/core-free-icons";

export default function ChatSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: convoData } = useGetConversation(id ?? "");
  const participant = (convoData as any)?.participant;

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const SettingItem = ({
    icon,
    label,
    onPress,
    destructive = false,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {}
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={showSwitch}
      className="flex-row items-center px-4 py-4"
      style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
    >
      <HugeiconsIcon
        icon={icon}
        size={22}
        color={destructive ? colors.destructive : colors.foreground}
      />
      <Text
        className="flex-1 ml-3 text-base"
        style={{ color: destructive ? colors.destructive : colors.foreground }}
      >
        {label}
      </Text>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      ) : (
        <View />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-3 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>Details</Text>
      </View>

    </View>
  );
}
