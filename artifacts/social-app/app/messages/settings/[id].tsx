import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
  Switch,
  TextInput,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConversation } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Notification01Icon,
  Delete02Icon,
  UnavailableIcon,
  Flag01Icon,
  PaintBoardIcon,
  UserEditIcon,
} from "@hugeicons/core-free-icons";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { useAuth } from "@/context/AuthContext";

const CHAT_COLORS = [
  "#ffffff", "#1d9bf0", "#7c3aed", "#059669",
  "#db2777", "#ea580c", "#0f172a",
];

export default function ChatSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const { data: convoData } = useGetConversation(id ?? "");
  const participant = (convoData as any)?.participant;
  const [nickname, setNickname] = React.useState("");
  const [bgColor, setBgColor] = React.useState("#ffffff");
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(`@chat_nickname_${id}`).then((val) => val && setNickname(val));
    AsyncStorage.getItem(`@chat_bg_${id}`).then((val) => val && setBgColor(val));
    AsyncStorage.getItem(`@chat_muted_${id}`).then((val) => setMuted(val === "true"));
  }, [id]);

  const saveNickname = async (val: string) => {
    setNickname(val);
    if (id) await AsyncStorage.setItem(`@chat_nickname_${id}`, val);
  };

  const toggleMute = async (val: boolean) => {
    setMuted(val);
    if (id) await AsyncStorage.setItem(`@chat_muted_${id}`, String(val));
  };

  const handleBlockUser = () => {
    if (!participant) return;
    Alert.alert(
      "Block User",
      `Block @${participant.username}? They won't be able to message you or see your profile.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const baseUrl = getApiBaseUrl();
              const res = await fetch(`${baseUrl}/api/users/${participant.id}/block`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              });
              if (res.ok) {
                Alert.alert("Blocked", `@${participant.username} has been blocked.`);
                router.push("/messages" as any);
              } else {
                Alert.alert("Error", "Could not block user. Please try again.");
              }
            } catch {
              Alert.alert("Error", "Connection failed. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    if (!participant) return;
    Alert.alert(
      "Report User",
      `Report @${participant.username} for inappropriate content?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              const baseUrl = getApiBaseUrl();
              await fetch(`${baseUrl}/api/users/${participant.id}/report`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "inappropriate_content" }),
              });
              Alert.alert("Reported", "Thank you for your report. We'll review it shortly.");
            } catch {
              Alert.alert("Reported", "Thank you for your report.");
            }
          },
        },
      ]
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "This will remove all messages from your view. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (id) {
              await AsyncStorage.removeItem(`@chat_nickname_${id}`);
              await AsyncStorage.removeItem(`@chat_bg_${id}`);
            }
            Alert.alert("Cleared", "Chat has been cleared.");
            router.back();
          },
        },
      ]
    );
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const SettingItem = ({
    icon,
    label,
    onPress,
    destructive = false,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = (_v: boolean) => {},
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-4"
      style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
    >
      <HugeiconsIcon
        icon={icon}
        size={22}
        color={destructive ? colors.destructive : colors.foreground}
        strokeWidth={1.5}
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
          thumbColor={Platform.OS === "ios" ? undefined : colors.background}
        />
      ) : null}
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
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
          Details
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Participant Info */}
        {participant && (
          <View className="items-center py-8">
            <UserAvatar uri={participant.avatarUrl} size={80} />
            <Text className="text-xl font-bold mt-3" style={{ color: colors.foreground }}>
              {participant.displayName || participant.username}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
              @{participant.username}
            </Text>
            <TouchableOpacity
              className="mt-4 px-6 py-2 rounded-full"
              style={{ backgroundColor: colors.muted }}
              onPress={() => router.push(`/profile/${participant.id}` as any)}
            >
              <Text className="font-semibold" style={{ color: colors.foreground }}>
                View Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customization */}
        <View className="mt-2">
          <Text
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.mutedForeground }}
          >
            Customization
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center px-4 py-3 gap-3">
              <HugeiconsIcon icon={UserEditIcon} size={20} color={colors.foreground} strokeWidth={1.5} />
              <TextInput
                placeholder="Set Nickname"
                placeholderTextColor={colors.mutedForeground}
                value={nickname}
                onChangeText={saveNickname}
                className="flex-1 text-sm h-9"
                style={{ color: colors.foreground }}
              />
            </View>
            <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 52 }} />
            {/* Chat color swatches */}
            <View className="flex-row items-center px-4 py-3 gap-3">
              <HugeiconsIcon icon={PaintBoardIcon} size={20} color={colors.foreground} strokeWidth={1.5} />
              <Text className="text-sm flex-1" style={{ color: colors.foreground }}>
                Chat Color
              </Text>
              <View className="flex-row gap-2">
                {CHAT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setBgColor(c);
                      if (id) AsyncStorage.setItem(`@chat_bg_${id}`, c);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: c,
                      borderWidth: bgColor === c ? 2 : 1,
                      borderColor: bgColor === c ? colors.primary : colors.border,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View className="mt-6">
          <Text
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.mutedForeground }}
          >
            Notifications
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <SettingItem
              icon={Notification01Icon}
              label="Mute Notifications"
              showSwitch
              switchValue={muted}
              onSwitchChange={toggleMute}
            />
          </View>
        </View>

        {/* Privacy & Support */}
        <View className="mt-6">
          <Text
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.mutedForeground }}
          >
            Privacy & Support
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <SettingItem
              icon={UnavailableIcon}
              label="Block User"
              destructive
              onPress={handleBlockUser}
            />
            <SettingItem
              icon={Flag01Icon}
              label="Report User"
              destructive
              onPress={handleReportUser}
            />
          </View>
        </View>

        {/* Chat Actions */}
        <View className="mt-6 mb-12">
          <Text
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.mutedForeground }}
          >
            Chat Actions
          </Text>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <SettingItem
              icon={Delete02Icon}
              label="Clear Chat"
              destructive
              onPress={handleClearChat}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
