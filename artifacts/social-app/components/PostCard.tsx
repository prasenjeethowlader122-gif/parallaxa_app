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
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={() => router.push(`/post/${id}` as any)}
      className="flex-row px-4 py-3" 
      style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
    >
      {/* Sidebar Avatar */}
      <View className="mr-3">
        <TouchableOpacity onPress={() => router.push(`/profile/${author.id}` as any)}>
          <UserAvatar uri={author.avatarUrl} size={45} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        {/* Header: Name, Username, Time */}
        <View className="flex-row items-center justify-between mb-0.5">
          <View className="flex-row items-center flex-shrink">
            <Text 
              numberOfLines={1}
              className="font-bold text-[15px] mr-1" 
              style={{ color: colors.foreground }}
            >
              {author.displayName}
            </Text>
            {author.isVerified && (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} color="#1d9bf0" variant="solid" />
            )}
            <Text 
              numberOfLines={1}
              className="ml-1 text-[15px]" 
              style={{ color: colors.mutedForeground }}
            >
              @{author.username} · {timeAgo(createdAt)}
            </Text>
          </View>
          <TouchableOpacity hitSlop={12}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Caption/Content */}
        {content && (
          <Text className="text-[15px] leading-5 mb-2" style={{ color: colors.foreground }}>
            {content}
            {hashtags.length > 0 && (
              <Text className="text-primary"> {hashtags.map(t => `#${t}`).join(" ")}</Text>
            )}
          </Text>
        )}

        {/* Media (X style: Rounded corners and border) */}
        {imageUrl && (
          <View className="rounded-2xl overflow-hidden border mb-3" style={{ borderColor: colors.border }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action Bar: Reply, Repost, Like, Save/Share */}
        <View className="flex-row justify-between items-center pr-4">
          <TouchableOpacity 
            onPress={() => onComment?.(id)}
            className="flex-row items-center gap-2 group"
          >
            <HugeiconsIcon icon={AiChatIcon} size={18} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center gap-2">
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>{Math.floor(likesCount / 3)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLike}
            className="flex-row items-center gap-2"
          >
            <HugeiconsIcon 
              icon={FavouriteIcon} 
              size={18} 
              color={isLiked ? colors.destructive : colors.mutedForeground} 
              variant={isLiked ? "solid" : "stroke"}
            />
            <Text 
              className="text-xs" 
              style={{ color: isLiked ? colors.destructive : colors.mutedForeground }}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={handleSave}>
              <HugeiconsIcon 
                icon={Bookmark02Icon} 
                size={18} 
                color={isSaved ? colors.primary : colors.mutedForeground} 
                variant={isSaved ? "solid" : "stroke"}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <HugeiconsIcon icon={Share01Icon} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}