import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

const { width } = Dimensions.get("window");

interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
}

interface PostCardProps {
  id: string;
  author: Author;
  content?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  hashtags?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  onLike?: (id: string, liked: boolean) => void;
  onSave?: (id: string, saved: boolean) => void;
  onComment?: (id: string) => void;
}

export function PostCard({
  id, author, content, imageUrl, location, hashtags = [],
  likesCount: initialLikesCount, commentsCount,
  isLiked: initialIsLiked, isSaved: initialIsSaved,
  createdAt, onLike, onSave, onComment,
}: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  const handleLike = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    onLike?.(id, newLiked);
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    onSave?.(id, newSaved);
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
    <View className="mb-1" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      {/* Header */}
      <TouchableOpacity
        className="flex-row items-center px-3 py-2.5"
        onPress={() => router.push(`/profile/${author.id}` as any)}
        activeOpacity={0.8}
      >
        <UserAvatar uri={author.avatarUrl} size={36} />
        <View className="flex-1 ml-2.5">
          <View className="flex-row items-center">
            <Text className="font-semibold text-sm" style={{ color: colors.foreground }}>
              {author.username}
            </Text>
            {author.isVerified && (
              <Feather name="check-circle" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
          {location && (
            <Text className="text-xs mt-px" style={{ color: colors.mutedForeground }}>
              {location}
            </Text>
          )}
        </View>
        <TouchableOpacity className="p-1">
          <Feather name="more-horizontal" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Image */}
      {imageUrl && (
        <TouchableOpacity onPress={() => router.push(`/post/${id}` as any)} activeOpacity={0.97}>
          <Image
            source={{ uri: imageUrl }}
            style={{ width, height: width, backgroundColor: "#F0F0F0" }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View className="flex-row justify-between items-center px-3 pt-2.5 pb-1">
        <View className="flex-row items-center gap-1">
          <TouchableOpacity onPress={handleLike} className="p-1 mr-2" activeOpacity={0.7}>
            <Feather name="heart" size={24} color={isLiked ? colors.destructive : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onComment?.(id); router.push(`/post/${id}` as any); }}
            className="p-1 mr-2"
            activeOpacity={0.7}
          >
            <Feather name="message-circle" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity className="p-1" activeOpacity={0.7}>
            <Feather name="send" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Feather name="bookmark" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <View className="px-3.5 pb-1">
        <Text className="font-semibold text-sm" style={{ color: colors.foreground }}>
          {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
        </Text>
      </View>

      {/* Caption */}
      {content && (
        <View className="px-3.5 pb-1">
          <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
            <Text className="font-semibold">{author.username} </Text>
            {content}
          </Text>
        </View>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <View className="px-3.5 pb-1">
          <Text className="text-sm font-medium text-primary">
            {hashtags.map((t) => `#${t}`).join(" ")}
          </Text>
        </View>
      )}

      {/* Comments hint */}
      {commentsCount > 0 && (
        <TouchableOpacity onPress={() => router.push(`/post/${id}` as any)}>
          <Text className="px-3.5 pb-1 text-sm" style={{ color: colors.mutedForeground }}>
            View all {commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text
        className="px-3.5 pb-3 text-[11px] uppercase tracking-wide"
        style={{ color: colors.mutedForeground }}
      >
        {timeAgo(createdAt)}
      </Text>
    </View>
  );
}
