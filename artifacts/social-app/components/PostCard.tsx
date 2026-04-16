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
import React, { useState, useCallback } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

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
  id, author, content, imageUrl, hashtags = [],
  likesCount: initialLikesCount, commentsCount,
  isLiked: initialIsLiked, isSaved: initialIsSaved,
  createdAt, onLike, onSave, onComment,
}: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  // Optimized Handlers
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

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={navigateToPost}
      className="flex-row px-4 py-3" 
      style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border || '#ccc' }}
    >
      {/* Sidebar Avatar */}
      <View className="mr-3">
        <TouchableOpacity onPress={navigateToProfile}>
          <UserAvatar uri={author.avatarUrl} size={28} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        {/* Header: Name, Username, Time */}
        <View className="flex-row items-center justify-between mb-0.5">
          <View className="flex-row items-center flex-1 flex-shrink">
            <Text 
              numberOfLines={1}
              className="font-bold text-[15px] mr-1" 
              style={{ color: colors.foreground }}
            >
              {author.displayName}
            </Text>
            {author.isVerified && (
              <View className="mr-1">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} color="#1d9bf0" variant="solid" />
              </View>
            )}
            <Text 
              numberOfLines={1}
              className="text-[14px] flex-shrink" 
              style={{ color: colors.mutedForeground }}
            >
              @{author.username} · {timeAgo(createdAt)}
            </Text>
          </View>
          
          <TouchableOpacity hitSlop={12}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {content && (
          <Text className="text-[15px] leading-5 mb-2" style={{ color: colors.foreground }}>
            {content}
          </Text>
        )}

        {/* Hashtags */}
        

        {/* Media */}
        {imageUrl && (
          <View className="rounded-2xl overflow-hidden border mb-3" style={{ borderColor: colors.border || '#eee' }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', aspectRatio: 1.77 }} // 16:9 ratio
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action Bar */}
        <View className="flex-row justify-between items-center w-full mt-1">
          {/* Reply */}
          <TouchableOpacity 
            onPress={() => onComment?.(id)}
            className="flex-row items-center gap-2"
            hitSlop={10}
          >
            <HugeiconsIcon icon={AiChatIcon} size={18} color={colors.mutedForeground} />
            <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>{commentsCount}</Text>
          </TouchableOpacity>

          {/* Repost (ArrowUp) */}
          <TouchableOpacity className="flex-row items-center gap-2" hitSlop={10}>
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={colors.mutedForeground} />
            <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
              {Math.floor(likesCount / 2.5)} 
            </Text>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity 
            onPress={handleLike}
            className="flex-row items-center gap-2"
            hitSlop={10}
          >
            <HugeiconsIcon 
              icon={FavouriteIcon} 
              size={18} 
              color={isLiked ? "#f91880" : colors.mutedForeground} 
              variant={isLiked ? "solid" : "stroke"}
            />
            <Text 
              className="text-[13px]" 
              style={{ color: isLiked ? "#f91880" : colors.mutedForeground }}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          {/* Save/Share Group */}
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={handleSave} hitSlop={10}>
              <HugeiconsIcon 
                icon={Bookmark02Icon} 
                size={18} 
                color={isSaved ? "#1d9bf0" : colors.mutedForeground} 
                variant={isSaved ? "solid" : "stroke"}
              />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10}>
              <HugeiconsIcon icon={Share01Icon} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}