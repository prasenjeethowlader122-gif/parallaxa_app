import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkBadge01Icon,
  FavouriteIcon,
  MoreHorizontalIcon,
  Share01Icon,
  Bookmark02Icon,
  MessageMultiple01Icon,
  Repeat01Icon,
} from '@hugeicons/core-free-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  // Both fields exist on the Post schema and are distinct:
  // - commentsCount: top-level comments on the post
  // - repliesCount:  nested replies to comments
  // The previous code dropped commentsCount entirely and used repliesCount for
  // the comment button, which would show the wrong number.
  commentsCount: number;
  repliesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  onLike?: (id: string, liked: boolean) => void;
  onSave?: (id: string, saved: boolean) => void;
  onComment?: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? String(n) : "";
}

// ─── Rich content renderer (mention + hashtag highlight) ─────────────────────
function RichText({ text, highlightColor }: { text: string; highlightColor: string }) {
  const parts = text.split(/(@\w+|#\w+)/g);
  return (
    <Text style={styles.content}>
      {parts.map((part, i) => {
        if (/^(@|#)\w+/.test(part)) {
          return (
            <Text key={i} style={[styles.contentHighlight, { color: highlightColor }]}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  icon,
  count,
  active,
  activeColor,
  onPress,
}: {
  icon: any;
  count?: number;
  active?: boolean;
  activeColor?: string;
  onPress?: () => void;
}) {
  const color = active && activeColor ? activeColor : "#71767b";
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.actionBtn}
      activeOpacity={0.7}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        color={color}
        variant={active ? "solid" : "stroke"}
        strokeWidth={1.5}
      />
      {count !== undefined && count > 0 && (
        <Text style={[styles.actionCount, active && activeColor ? { color } : null]}>
          {formatCount(count)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
export function PostCard({
  id,
  author,
  content,
  imageUrl,
  hashtags = [],
  likesCount: initialLikesCount,
  commentsCount,
  repliesCount,
  isLiked: initialIsLiked,
  isSaved: initialIsSaved,
  createdAt,
  onLike,
  onSave,
  onComment,
}: PostCardProps) {
  const router = useRouter();
  const colors = useColors();

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [reposted, setReposted] = useState(false);

  const handleLike = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    onLike?.(id, next);
  }, [isLiked, id, onLike]);

  const handleSave = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !isSaved;
    setIsSaved(next);
    onSave?.(id, next);
  }, [isSaved, id, onSave]);

  const handleRepost = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReposted((r) => !r);
  }, []);

  const repostCount = Math.round(initialLikesCount * 0.4);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id } })}
      style={[styles.card, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
    >
      {/* ── Left column: avatar + thread line ── */}
      <View style={styles.leftCol}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/profile/[id]", params: { id: author.id } })}
          activeOpacity={0.8}
        >
          <UserAvatar uri={author.avatarUrl} size={40} />
        </TouchableOpacity>
        <View style={[styles.threadLine, { backgroundColor: colors.border }]} />
      </View>

      {/* ── Right column ── */}
      <View style={styles.rightCol}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={() => router.push({ pathname: "/profile/[id]", params: { id: author.id } })}
            activeOpacity={0.75}
          >
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.foreground }]} numberOfLines={1}>
                {author.displayName}
              </Text>
              {author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={15}
                  color="#1d9bf0"
                  variant="solid"
                />
              )}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              @{author.username} · {timeAgo(createdAt)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} color="#71767b" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {content ? <RichText text={content} highlightColor={colors.primary} /> : null}

        {/* Image */}
        {imageUrl ? (
          <View style={[styles.imageWrap, { borderColor: colors.border }]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Hashtag pills (if any not already in text) */}
        {hashtags.length > 0 && !content?.includes("#") && (
          <View style={styles.hashtagRow}>
            {hashtags.slice(0, 4).map((tag) => (
              <View key={tag} style={styles.hashtagPill}>
                <Text style={[styles.hashtagPillText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {/* commentsCount = top-level comments; correct field for the comment button */}
          <ActionBtn
            icon={MessageMultiple01Icon}
            count={commentsCount}
            onPress={() => onComment?.(id)}
          />
          <ActionBtn
            icon={Repeat01Icon}
            count={repostCount}
            active={reposted}
            activeColor="#00ba7c"
            onPress={handleRepost}
          />
          <ActionBtn
            icon={FavouriteIcon}
            count={likesCount}
            active={isLiked}
            activeColor="#f91880"
            onPress={handleLike}
          />
          <View style={styles.actionsRight}>
            <ActionBtn
              icon={Bookmark02Icon}
              active={isSaved}
              activeColor="#1d9bf0"
              onPress={handleSave}
            />
            <ActionBtn icon={Share01Icon} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Left column
  leftCol: {
    alignItems: "center",
    marginRight: 10,
  },
  threadLine: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginTop: 4,
    borderRadius: 1,
    opacity: 0.4,
  },

  // Right column
  rightCol: {
    flex: 1,
    paddingBottom: 10,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  authorInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "nowrap",
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  meta: {
    fontSize: 14,
    color: "#71767b",
    marginTop: 1,
  },

  // Content
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0f1419",
    marginTop: 2,
    marginBottom: 10,
  },
  contentHighlight: {
    fontWeight: "500",
  },

  // Image
  imageWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },

  // Hashtag pills
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  hashtagPill: {
    backgroundColor: "#e8f5fd",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  hashtagPillText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Actions
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  actionsRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingRight: 16,
  },
  actionCount: {
    fontSize: 13,
    color: "#71767b",
    fontWeight: "400",
  },
});