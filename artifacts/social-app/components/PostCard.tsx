import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AiChatIcon,
  ArrowUp01Icon,
  Bookmark02Icon,
  CheckmarkBadge01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  Share01Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text } from "@/components/Text";
import React, { useState, useCallback } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, Share, Modal, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import SocialNative from '@/modules/social-native';
import { UserAvatar } from "./UserAvatar";
import { useCreatePost } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  hasStory?: boolean;
  hasUnviewedStory?: boolean;
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
  const { mutate: createPost } = useCreatePost();
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => prev + (newLiked ? 1 : -1));
    onLike?.(id, newLiked);
  }, [isLiked, id, onLike, user, router]);

  const handleSave = useCallback(async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    onSave?.(id, newSaved);
  }, [isSaved, id, onSave, user, router]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: content || '',
        url: imageUrl || '',
      });
    } catch (error) {
      console.error(error);
    }
  }, [content, imageUrl]);

  const handleRepost = useCallback(() => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createPost({
      data: {
        parentPostId: id,
        content: "Reposted",
      },
    });
  }, [id, createPost, user, router]);

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

  const handleDownload = async () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      // Mock logo base64 for watermark
      const logoBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      if (SocialNative) {
        const watermarkedUri = await SocialNative.watermarkImage(imageUrl, logoBase64);
        await Share.share({ url: watermarkedUri });
      } else {
        await Share.share({ url: imageUrl });
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={navigateToPost}
      style={[
        styles.card,
        { borderBottomColor: '#f2f2f2' }
      ]}
    >
      {/* ── Author row (Matching Skeleton) ── */}
      <View style={styles.authorRow}>
        <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8} style={{ marginRight: 10 }}>
          <UserAvatar
            uri={author.avatarUrl}
            size={40}
            hasStory={author.hasStory}
            hasUnviewedStory={author.hasUnviewedStory}
          />
        </TouchableOpacity>
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* Name & Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              numberOfLines={1}
              className="font-bold text-[15px]"
              style={{ color: colors.foreground }}
            >
              {author.displayName}
            </Text>
            {author.isVerified && (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} color="#1d9bf0" />
            )}
          </View>
          {/* Username & Time */}
          <Text
            numberOfLines={1}
            className="text-[13px]"
            style={{ color: colors.mutedForeground, marginTop: 2 }}
          >
            @{author.username} · {timeAgo(createdAt)}
          </Text>
        </View>

        {/* More icon - Moved to Top Right to match Skeleton */}
        <TouchableOpacity hitSlop={10}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Content Block ── */}
      {content && (
        <View style={styles.contentBlock}>
          <Text
            className="text-[15px] leading-[21px]"
            style={{ color: colors.foreground }}
          >
            {content.split(/((?:@|#)\w+|(?:https?:\/\/[^\s]+))/g).map((part, index) => {
              if (part.startsWith('#') || part.startsWith('@') || part.startsWith('http')) {
                return (
                  <Text key={index} style={{ color: colors.primary }}>
                    {part}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        </View>
      )}

      {/* ── Link Preview ── */}
      {!imageUrl && content?.match(/https?:\/\/[^\s]+/) && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 14,
            borderRadius: 12,
            borderWidth: 0,
            borderColor: colors.border,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#f1f1f1'
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
            <HugeiconsIcon icon={Share01Icon} size={20} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
              {content.match(/https?:\/\/([^\/\s]+)/)?.[1] || "Link Preview"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
              {content.match(/(https?:\/\/[^\s]+)/)?.[0]}
            </Text>
          </View>
        </View>
      )}

      {/* ── Image ── */}
      {imageUrl && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsPreviewVisible(true)}
          style={[styles.imageContainer]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            contentFit="cover"
          />
        </TouchableOpacity>
      )}

      {/* ── Image Preview Modal ── */}
      <Modal visible={isPreviewVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
            onPress={() => setIsPreviewVisible(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={30} color="#fff" />
          </TouchableOpacity>

          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '70%' }}
              contentFit="contain"
            />
          )}

          <View style={{ flexDirection: 'row', gap: 20, marginTop: 40 }}>
            {user && (
            <TouchableOpacity
              onPress={() => {
                setIsPreviewVisible(false);
                router.push({ pathname: "/create", params: { imageUrl } });
              }}
              style={{ backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 }}
            >
              <Text style={{ fontWeight: 'bold' }}>Reuse</Text>
            </TouchableOpacity>)}

            <TouchableOpacity
              onPress={handleDownload}
              disabled={isDownloading}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {isDownloading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Download</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Hashtag Pills (Matching Skeleton Pill Design) ── */}


      {/* ── Action bar ── */}
      <View style={styles.actionRow}>
        {/* Reply */}
        <TouchableOpacity
          onPress={() => {
            if (!user) {
              router.push("/(auth)/login");
              return;
            }
            onComment?.(id);
          }}
          hitSlop={10}
          style={styles.actionItem}
        >
          <HugeiconsIcon icon={AiChatIcon} strokeWidth={2} size={20} color={colors.mutedForeground} />
          {commentsCount > 0 && (
            <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
              {commentsCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Repost */}
        <TouchableOpacity
          onPress={handleRepost}
          hitSlop={10}
          style={styles.actionItem}
        >
          <HugeiconsIcon icon={ArrowUp01Icon} size={20} strokeWidth={2} color={colors.mutedForeground} />
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
          style={styles.actionItem}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={20}
            strokeWidth={2}
            color={isLiked ? "#f91880" : colors.mutedForeground}
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
          style={styles.actionItem}
        >
          <HugeiconsIcon
            icon={Bookmark02Icon}
            strokeWidth={2}
            size={20}
            color={isSaved ? "#1d9bf0" : colors.mutedForeground}
          />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity onPress={handleShare} hitSlop={10} style={styles.actionItem}>
          <HugeiconsIcon icon={Share01Icon} size={20} strokeWidth={2} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles (Matched with Skeleton Loader) ────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contentBlock: {
    marginBottom: 14,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 0,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});