import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
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
      className="flex-row items-center px-4 py-3"
      style={{ backgroundColor: isRead ? "transparent" : `${colors.primary}12` }}
      onPress={() => {
        if (type === "follow") router.push(`/profile/${fromUser.id}` as any);
        else if (post) router.push(`/post/${post.id}` as any);
      }}
      activeOpacity={0.7}
    >
      <UserAvatar uri={fromUser.avatarUrl} size={44} />
      <View className="flex-1 mx-3">
        <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
          <Text className="font-semibold">{fromUser.username} </Text>
          {getMessage()}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
          {timeAgo(createdAt)}
        </Text>
      </View>
      {post?.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          className="w-11 h-11 rounded-md"
          style={{ borderColor: colors.border, borderWidth: 0.5 }}
        />
      )}
      {!isRead && (
        <View
          className="w-2 h-2 rounded-full ml-2"
          style={{ backgroundColor: colors.primary }}
        />
      )}
    </TouchableOpacity>
  );
}
