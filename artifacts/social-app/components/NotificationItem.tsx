import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

interface NotificationItemProps {
  id: string;
  type: string;
  fromUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  post?: { id: string; imageUrl?: string | null } | null;
  commentContent?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationItem({ type, fromUser, post, commentContent, isRead, createdAt }: NotificationItemProps) {
  const colors = useColors();
  const router = useRouter();

  const getMessage = () => {
    switch (type) {
      case "like": return "liked your photo.";
      case "comment": return commentContent ? `commented: ${commentContent}` : "commented on your photo.";
      case "follow": return "started following you.";
      case "mention": return "mentioned you in a comment.";
      case "reply": return "replied to your comment.";
      default: return "interacted with you.";
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return `${Math.floor(d / 7)}w`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isRead ? "transparent" : `${colors.primary}10` },
      ]}
      onPress={() => {
        if (type === "follow") router.push(`/profile/${fromUser.id}` as any);
        else if (post) router.push(`/post/${post.id}` as any);
      }}
      activeOpacity={0.7}
    >
      <UserAvatar uri={fromUser.avatarUrl} size={44} />
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.foreground }]}>
          <Text style={styles.username}>{fromUser.username} </Text>
          {getMessage()}
        </Text>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(createdAt)}</Text>
      </View>
      {post?.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={[styles.thumbnail, { borderColor: colors.border }]} />
      )}
      {!isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginHorizontal: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 19,
  },
  username: {
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
    marginTop: 3,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
