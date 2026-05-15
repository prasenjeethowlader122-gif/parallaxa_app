import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/Text";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

interface ConversationItemProps {
  id: string;
  participant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
  };
  lastMessage?: {
    content?: string | null;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  myId: string;
}

export function ConversationItem({
  id,
  participant,
  lastMessage,
  unreadCount,
  myId,
}: ConversationItemProps) {
  const colors = useColors();
  const router = useRouter();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return `${Math.floor(d / 7)}w`;
  };

  const lastMsgText = lastMessage
    ? lastMessage.senderId === myId
      ? `You: ${lastMessage.content ?? "Sent a photo"}`
      : lastMessage.content ?? "Sent a photo"
    : "Say hi!";

  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3"
      onPress={() => router.push(`/messages/${id}` as any)}
      activeOpacity={0.7}
    >
      <UserAvatar uri={participant.avatarUrl} size={52} />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center mb-0.5">
          <View className="flex-row items-center gap-1 flex-1 mr-2">
            <Text
              className={`text-[15px] ${hasUnread ? "font-bold" : "font-medium"}`}
              style={{ color: colors.foreground }}
              numberOfLines={1}
            >
              {participant.displayName || participant.username}
            </Text>
            {participant.isVerified && (
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={13}
                color={colors.verified}
              />
            )}
          </View>
          {lastMessage && (
            <Text
              className={`text-xs flex-shrink-0 ${hasUnread ? "font-semibold" : ""}`}
              style={{ color: hasUnread ? colors.primary : colors.mutedForeground }}
            >
              {timeAgo(lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-sm flex-1 mr-2 ${hasUnread ? "font-semibold" : ""}`}
            style={{
              color: hasUnread ? colors.foreground : colors.mutedForeground,
            }}
            numberOfLines={1}
          >
            {lastMsgText}
          </Text>
          {hasUnread && (
            <View
              className="min-w-[20px] h-5 rounded-full px-1.5 items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-[11px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
