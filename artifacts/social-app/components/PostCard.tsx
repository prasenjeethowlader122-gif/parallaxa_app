import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AiChatIcon,
  ArrowUp01Icon,
  Bookmark02Icon,
  CheckmarkBadge01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  Share01Icon
} from '@hugeicons/core-free-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text } from "@/components/Text"
import React, { useState, useCallback } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl ? : string | null;
  isVerified: boolean;
}

interface PostCardProps {
  id: string;
  author: Author;
  content ? : string | null;
  imageUrl ? : string | null;
  hashtags ? : string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  onLike ? : (id: string, liked: boolean) => void;
  onSave ? : (id: string, saved: boolean) => void;
  onComment ? : (id: string) => void;
}

export function PostCard({
  id,
  author,
  content,
  imageUrl,
  hashtags = [],
  likesCount: initialLikesCount,
  commentsCount,
  isLiked: initialIsLiked,
  isSaved: initialIsSaved,
  createdAt,
  onLike,
  onSave,
  onComment,
}: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  const handleLike = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => prev + (newLiked ? 1 : -1));
    onLike?.(id, newLiked);
  }, [isLiked, id, onLike]);
  
  const handleSave = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    onSave?.(id, newSaved);
  }, [isSaved, id, onSave]);
  
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };
  
  const navigateToPost = () => router.push({ pathname: "/post/[id]", params: { id } });
  const navigateToProfile = () => router.push({ pathname: "/profile/[id]", params: { id: author.id } });
  
  const repostCount = Math.floor(likesCount / 2.5);
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={navigateToPost}
      className="flex-row px-4 pt-3 pb-1"
      style={{ borderBottomWidth: 2, borderBottomColor: '#f2f2f2' }}
    >
      {/* Left Column: Avatar */}
      <View className="mr-3 items-center">
        <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}>
          <UserAvatar uri={author.avatarUrl} size={40} />
        </TouchableOpacity>
      </View>

      {/* Right Column: Everything */}
      <View className="flex-1">

        {/* Header Row: DisplayName + verified + username + time + more */}
        <View className="flex-row items-center justify-between mb-0.5">
          <View className="flex-row items-center flex-1 flex-shrink gap-1">
            {/* Display name */}
            <Text
              numberOfLines={1}
              className="font-bold text-[15px]"
              style={{ color: colors.foreground }}
            >
              {author.displayName}
            </Text>

            {/* Verified badge inline with name */}
            {author.isVerified && (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} color="#1d9bf0" variant="solid" />
            )}

            {/* Username · time — muted, truncates if needed */}
            <Text
              numberOfLines={1}
              className="text-[14px] flex-shrink"
              style={{ color: colors.mutedForeground }}
            >
              @{author.username} · {timeAgo(createdAt)}
            </Text>
          </View>

          {/* More button */}

        </View>

        {/* Post Text */}
        {content && (
          <Text
            className="text-[15px] leading-[21px] mb-2"
            style={{ color: colors.foreground }}
          >
            {content}
          </Text>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <Text className="text-[14px] mb-2" style={{ color: '#1d9bf0' }}>
            {hashtags.map(tag => `#${tag}`).join(' ')}
          </Text>
        )}

        {/* Media */}
        {imageUrl && (
          <View
            className="rounded-2xl overflow-hidden mb-3"
            style={{ borderWidth: 0.5, borderColor: colors.border || '#2f3336' }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action Bar — X/Twitter style: reply, repost, like, views/save, share */}
        <View className="flex-row items-center justify-between mt-1 mb-2" style={{ marginLeft: -4 }}>

          {/* Reply */}
          <TouchableOpacity
            onPress={() => onComment?.(id)}
            hitSlop={10}
            className="flex-row items-center"
            style={{ gap: 5, paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon icon={AiChatIcon} strokeWidth={2} size={18} color={colors.mutedForeground} />
            {commentsCount > 0 && (
              <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
                {commentsCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Repost */}
          <TouchableOpacity
            hitSlop={10}
            className="flex-row items-center"
            style={{ gap: 5, paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={2} color={colors.mutedForeground} />
            {repostCount > 0 && (
              <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
                {repostCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            onPress={handleLike}
            hitSlop={10}
            className="flex-row items-center"
            style={{ gap: 5, paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={18}
              strokeWidth={2}
              color={isLiked ? "#f91880" : colors.mutedForeground}
              variant={isLiked ? "solid" : "stroke"}
            />
            {likesCount > 0 && (
              <Text
                className="text-[13px]"
                style={{ color: isLiked ? "#f91880" : colors.mutedForeground }}
              >
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Bookmark */}
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={10}
            style={{ paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon
              icon={Bookmark02Icon}
              strokeWidth={2}
              size={18}
              color={isSaved ? "#1d9bf0" : colors.mutedForeground}
              variant={isSaved ? "solid" : "stroke"}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            hitSlop={10}
            style={{ paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon icon={Share01Icon} size={18} strokeWidth={2} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
          hitSlop={10}
            style={{ paddingHorizontal: 4, paddingVertical: 6 }}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} strokeWidth={2} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}