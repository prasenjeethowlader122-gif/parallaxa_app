import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

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

export function ConversationItem({ id, participant, lastMessage, unreadCount, myId }: ConversationItemProps) {
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/messages/${id}` as any)}
      activeOpacity={0.7}
    >
      <UserAvatar uri={participant.avatarUrl} size={52} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }, unreadCount > 0 && styles.bold]}>
            {participant.username}
          </Text>
          {lastMessage && (
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo(lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              { color: unreadCount > 0 ? colors.foreground : colors.mutedForeground },
              unreadCount > 0 && styles.bold,
            ]}
            numberOfLines={1}
          >
            {lastMsgText}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
  },
  time: {
    fontSize: 12,
  },
  preview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  bold: {
    fontWeight: "700",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
