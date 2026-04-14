import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    onLike?.(id, newLiked);
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/profile/${author.id}` as any)}
        activeOpacity={0.8}
      >
        <UserAvatar uri={author.avatarUrl} size={36} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.username, { color: colors.foreground }]}>{author.username}</Text>
            {author.isVerified && (
              <Feather name="check-circle" size={13} color={colors.primary} style={styles.verifiedIcon} />
            )}
          </View>
          {location && (
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{location}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Image */}
      {imageUrl && (
        <TouchableOpacity onPress={() => router.push(`/post/${id}` as any)} activeOpacity={0.97}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { width: width }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn} activeOpacity={0.7}>
            <Feather
              name={isLiked ? "heart" : "heart"}
              size={24}
              color={isLiked ? colors.destructive : colors.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onComment?.(id); router.push(`/post/${id}` as any); }}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Feather name="message-circle" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Feather name="send" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Feather
            name="bookmark"
            size={24}
            color={isSaved ? colors.foreground : colors.foreground}
          />
        </TouchableOpacity>
      </View>

      {/* Likes count */}
      <View style={styles.likesContainer}>
        <Text style={[styles.likesText, { color: colors.foreground }]}>
          {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
        </Text>
      </View>

      {/* Caption */}
      {content && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: colors.foreground }]}>
            <Text style={styles.captionUsername}>{author.username} </Text>
            {content}
          </Text>
        </View>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          <Text style={[styles.hashtags, { color: colors.primary }]}>
            {hashtags.map((t) => `#${t}`).join(" ")}
          </Text>
        </View>
      )}

      {/* Comments hint */}
      {commentsCount > 0 && (
        <TouchableOpacity onPress={() => router.push(`/post/${id}` as any)}>
          <Text style={[styles.viewComments, { color: colors.mutedForeground }]}>
            View all {commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  location: {
    fontSize: 12,
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  image: {
    height: width,
    backgroundColor: "#F0F0F0",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 4,
    marginRight: 8,
  },
  likesContainer: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  likesText: {
    fontWeight: "600",
    fontSize: 14,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: "600",
  },
  hashtagsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  hashtags: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewComments: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    fontSize: 14,
  },
  time: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
