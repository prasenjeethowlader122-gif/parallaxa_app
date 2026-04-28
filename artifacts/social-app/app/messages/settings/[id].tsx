import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Switch,
  TextInput,
} from "react-native";
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

export default function ChatSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: convoData } = useGetConversation(id ?? "");
  const participant = (convoData as any)?.participant;
  const [nickname, setNickname] = React.useState("");
  const [bgColor, setBgColor] = React.useState("#ffffff");

  React.useEffect(() => {
    if (id) {
      AsyncStorage.getItem(`@chat_nickname_${id}`).then(val => val && setNickname(val));
      AsyncStorage.getItem(`@chat_bg_${id}`).then(val => val && setBgColor(val));
    }
  }, [id]);

  const saveNickname = async (val: string) => {
    setNickname(val);
    if (id) await AsyncStorage.setItem(`@chat_nickname_${id}`, val);
  };

  const saveBgColor = async (val: string) => {
    setBgColor(val);
    if (id) await AsyncStorage.setItem(`@chat_bg_${id}`, val);
  };

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

      <ScrollView className="flex-1">
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
              <Text className="font-semibold" style={{ color: colors.foreground }}>View Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-bold uppercase" style={{ color: colors.mutedForeground }}>
            Customization
          </Text>
          <View className="px-4 py-2">
            <View className="flex-row items-center gap-3 bg-gray-50 rounded-xl px-3 py-1">
              <HugeiconsIcon icon={UserEditIcon} size={20} color={colors.foreground} />
              <TextInput
                placeholder="Set Nickname"
                value={nickname}
                onChangeText={saveNickname}
                className="flex-1 h-10 text-sm"
                style={{ color: colors.foreground }}
              />
            </View>
          </View>
          <View className="px-4 py-2">
            <View className="flex-row items-center gap-3 bg-gray-50 rounded-xl px-3 py-1">
              <HugeiconsIcon icon={PaintBoardIcon} size={20} color={colors.foreground} />
              <TextInput
                placeholder="Chat Wallpaper Color (Hex)"
                value={bgColor}
                onChangeText={saveBgColor}
                className="flex-1 h-10 text-sm"
                style={{ color: colors.foreground }}
              />
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: bgColor, borderWidth: 1, borderColor: '#ccc' }} />
            </View>
          </View>
        </View>

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-bold uppercase" style={{ color: colors.mutedForeground }}>
            Notifications
          </Text>
          <SettingItem
            icon={Notification01Icon}
            label="Mute Notifications"
            showSwitch={true}
            switchValue={false}
          />
        </View>

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-bold uppercase" style={{ color: colors.mutedForeground }}>
            Privacy & Support
          </Text>
          <SettingItem
            icon={UnavailableIcon}
            label="Block User"
            destructive={true}
            onPress={() => {}}
          />
          <SettingItem
            icon={Flag01Icon}
            label="Report User"
            destructive={true}
            onPress={() => {}}
          />
        </View>

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-bold uppercase" style={{ color: colors.mutedForeground }}>
            Chat Actions
          </Text>
          <SettingItem
            icon={Delete02Icon}
            label="Clear Chat"
            destructive={true}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}
