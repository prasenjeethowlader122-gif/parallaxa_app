import React, { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/Text";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  FavouriteIcon,
  AiChatIcon,
  Share01Icon,
  CheckmarkBadge01Icon,
  Bookmark02Icon,
  MoreHorizontalIcon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetPost,
  useLikePost,
  useUnlikePost,
  useGetReplies,
  useCreatePost,
  useSavePost,
  useUnsavePost,
  useAdminDeletePost,
  Post,
  getGetRepliesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import Svg, { Path, Line } from "react-native-svg";

// ── Constants ─────────────────────────────────────────────────────────────────
const PARENT_AVATAR_SIZE = 38;
const REPLY_AVATAR_SIZE = 28;
const GUTTER_WIDTH = PARENT_AVATAR_SIZE;
const GUTTER_GAP = 10;

/**
 * Thread line geometry (all values in px):
 *
 *  Parent avatar center X  = GUTTER_WIDTH / 2 = 19
 *  SVG width               = GUTTER_WIDTH     = 38
 *  SVG height              = CURVE_SVG_HEIGHT = 32
 *
 *  Path: M19 0  →  L19 18  →  Q19 32 38 32
 *    • Straight down from top to y=18
 *    • Quadratic bezier: control (19,32), end (38,32) — exits at right edge
 *
 *  Reply row padding-top   = CURVE_SVG_HEIGHT - (REPLY_AVATAR_SIZE / 2)
 *                          = 32 - 14 = 18
 *    • This aligns the curve endpoint exactly with the reply avatar center.
 */
const CURVE_SVG_HEIGHT = 32;
const REPLY_ROW_TOP_PAD = CURVE_SVG_HEIGHT - REPLY_AVATAR_SIZE / 2; // 18

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${time} · ${date}`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Tree Logic ────────────────────────────────────────────────────────────────
type CommentWithReplies = Post & { replies: CommentWithReplies[] };

function buildCommentTree(flatComments: Post[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  const sorted = [...flatComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  sorted.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentPostId && map.has(c.parentPostId)) {
      map.get(c.parentPostId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ── Thread Line Components ────────────────────────────────────────────────────

/** Straight vertical line that runs below the parent avatar while replies exist. */
function StraightLine({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 2,
        flex: 1,
        minHeight: 12,
        backgroundColor: color,
        marginTop: 4,
        borderRadius: 1,
      }}
    />
  );
}

/**
 * Curved connector that bends from the straight line above
 * down and to the right, ending exactly at the reply avatar center.
 *
 * SVG viewBox: 0 0 38 32
 * Path: M19 0 L19 18 Q19 32 38 32
 */
function CurvedConnector({ color }: { color: string }) {
  return (
    <Svg
      width={GUTTER_WIDTH}
      height={CURVE_SVG_HEIGHT}
      viewBox={`0 0 ${GUTTER_WIDTH} ${CURVE_SVG_HEIGHT}`}
    >
      <Path
        d={`M${GUTTER_WIDTH / 2} 0 L${GUTTER_WIDTH / 2} 18 Q${GUTTER_WIDTH / 2} ${CURVE_SVG_HEIGHT} ${GUTTER_WIDTH} ${CURVE_SVG_HEIGHT}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string | null;
    username: string;
  } | null>(null);

  const { data: post, isLoading: postLoading, refetch: refetchPost } = useGetPost(id ?? "");
  const { data: commentsData, isLoading: commentsLoading } = useGetReplies(id ?? "");

  const { mutate: adminDeletePost } = useAdminDeletePost({
    mutation: {
       onSuccess: () => {
         router.back();
       }
    }
  });

  const comments = commentsData?.posts ?? [];
  const rootComments = React.useMemo(() => buildCommentTree(comments), [comments]);

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: unsavePost } = useUnsavePost();
  const { mutate: createPost, isPending: isSubmittingComment } = useCreatePost({
    mutation: {
      onMutate: async (variables: any) => {
        const text = variables.data.content?.trim();
        const parentId = variables.data.parentPostId;
        if (!text || !id || !user) return;

        await queryClient.cancelQueries({ queryKey: getGetRepliesQueryKey(id) });
        const previousComments = queryClient.getQueryData(getGetRepliesQueryKey(id));

        if (previousComments) {
          const optimisticComment: Post = {
            id: Math.random().toString(36).substring(7),
            parentPostId: parentId === id ? null : parentId,
            content: text,
            author: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              isVerified: user.isVerified,
              isFollowing: false,
            },
            hashtags: [],
            likesCount: 0,
            repliesCount: 0,
            isLiked: false,
            isSaved: false,
            createdAt: new Date().toISOString(),
          };

          queryClient.setQueryData(getGetRepliesQueryKey(id), (old: any) => ({
            ...old,
            posts: [optimisticComment, ...(old?.posts ?? [])],
          }));
        }

        return { previousComments };
      },
      onError: (_err: any, _variables: any, context: any) => {
        if (context?.previousComments) {
          queryClient.setQueryData(getGetRepliesQueryKey(id), context.previousComments);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getGetRepliesQueryKey(id) });
        refetchPost();
      },
    },
  });

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);

  const isLiked = localLiked !== null ? localLiked : (post?.isLiked ?? false);
  const likesCount = localCount !== null ? localCount : (post?.likesCount ?? 0);
  const isSaved = localSaved !== null ? localSaved : (post?.isSaved ?? false);

  const handleLike = useCallback(() => {
    if (!user) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isLiked;
    setLocalLiked(next);
    setLocalCount(likesCount + (next ? 1 : -1));
    if (next) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id, likePost, unlikePost]);

  const handleSave = useCallback(() => {
    if (!user) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !isSaved;
    setLocalSaved(next);
    if (next) savePost({ postId: id! });
    else unsavePost({ postId: id! });
  }, [isSaved, id, savePost, unsavePost]);

  const openReply = useCallback(
    (commentId: string | null, username: string) => {
      const alreadyTargeted = replyTarget?.commentId === commentId;
      setReplyTarget(alreadyTargeted ? null : { commentId, username });
      setTimeout(() => inputRef.current?.focus(), 80);
    },
    [replyTarget]
  );

  const handleSend = useCallback(() => {
    const text = replyText.trim();
    if (!text || !id || !user) return;

    const parentId = replyTarget?.commentId ?? id;

    createPost(
      { data: { content: text, parentPostId: parentId } },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyTarget(null);
        },
      }
    );
  }, [replyText, replyTarget, id, user, createPost]);

  const topPad = insets.top + (Platform.OS === "web" ? 20 : 8);

  if (postLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── List Header ─────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Author row */}
      {post?.author && (
        <View className="flex-row items-center px-4 pt-4 pb-1 gap-2.5">
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.85}
          >
            <UserAvatar uri={post.author.avatarUrl} size={44} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1"
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-1">
              <Text
                className="text-[15px] font-bold tracking-tight"
                style={{ color: colors.foreground }}
                numberOfLines={1}
              >
                {post.author.displayName ?? post.author.username}
              </Text>
              {post.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={16}
                  color={colors.primary}
                />
              )}
            </View>
            <Text className="text-sm mt-0.5" style={{ color: colors.mutedForeground }}>
              @{post.author.username}
            </Text>
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity
              onPress={() => adminDeletePost({ postId: id! })}
              className="px-3 py-1.5 rounded-full bg-red-500/10"
              activeOpacity={0.7}
            >
              <Text className="text-red-500 text-xs font-bold">Delete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="w-8 h-8 rounded-full items-center justify-center"
            activeOpacity={0.7}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={18}
              strokeWidth={2}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Post content */}
      {post?.content ? (
        <Text
          className="text-[20px] leading-[28px] tracking-tight px-4 pt-3 pb-2"
          style={{ color: colors.foreground }}
        >
          {post.content}
        </Text>
      ) : null}

      {/* Post image */}
      {post?.imageUrl ? (
        <View className="px-4 pb-2">
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 16 }}
            contentFit="cover"
          />
        </View>
      ) : null}

      {/* Timestamp */}
      {post?.createdAt ? (
        <Text
          className="text-sm px-4 py-3 border-t border-b"
          style={{ color: colors.mutedForeground, borderColor: colors.border }}
        >
          {formatFullDate(post.createdAt)}
        </Text>
      ) : null}

      {/* Stats row */}
      {(likesCount > 0 || (post?.repliesCount ?? 0) > 0) ? (
        <View
          className="flex-row gap-4 px-4 py-3 border-b"
          style={{ borderColor: colors.border }}
        >
          {(post?.repliesCount ?? 0) > 0 && (
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              <Text className="font-bold" style={{ color: colors.foreground }}>
                {fmtCount(post?.repliesCount ?? 0)}
              </Text>
              {" Replies"}
            </Text>
          )}
          {likesCount > 0 && (
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              <Text className="font-bold" style={{ color: colors.foreground }}>
                {fmtCount(likesCount)}
              </Text>
              {likesCount === 1 ? " Like" : " Likes"}
            </Text>
          )}
        </View>
      ) : null}

      {/* Action bar */}
      <View className="flex-row px-2" style={{ borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => openReply(null, post?.author?.username ?? "")}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={AiChatIcon}
            size={20}
            strokeWidth={2}
            color={
              replyTarget?.commentId === null ? colors.primary : colors.mutedForeground
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={ArrowUp01Icon}
            size={20}
            strokeWidth={2}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={20}
            strokeWidth={2}
            color={isLiked ? "#F4212E" : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={Bookmark02Icon}
            size={20}
            strokeWidth={2}
            color={isSaved ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={Share01Icon}
            size={20}
            strokeWidth={2}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Replies label */}
      <View className="px-4 py-2.5 border-b" style={{ borderColor: colors.border }}>
        <Text
          className="text-[14px] font-bold tracking-widest"
          style={{ color: colors.mutedForeground }}
        >
          Replies
        </Text>
      </View>

      {/* Replying-to banner */}
      {replyTarget ? (
        <View
          className="flex-row items-center justify-between px-4 py-2 border-b"
          style={{
            backgroundColor: colors.primary + "10",
            borderColor: colors.border,
          }}
        >
          <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
            Replying to{" "}
            <Text style={{ color: colors.primary }}>@{replyTarget.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTarget(null)} hitSlop={8}>
            <Text className="text-[13px] font-semibold" style={{ color: colors.primary }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const navigateToPost = (postId: string) =>
    router.push(`/post/${postId}` as any);

  const navigateToProfile = (userId: string) =>
    router.push(`/profile/${userId}` as any);

  const renderItem = ({ item }: { item: CommentWithReplies }) => (
    <CommentItem
      comment={item}
      isTargeted={replyTarget?.commentId === item.id}
      onReply={openReply}
      onNavigate={navigateToPost}
      onProfileNavigate={navigateToProfile}
      depth={0}
    />
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Nav (Sticky) */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b"
        style={{
          paddingTop: topPad,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            strokeWidth={2.2}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <Text
          className="text-[17px] font-bold tracking-tight"
          style={{ color: colors.foreground }}
        >
          Post
        </Text>
        <View className="w-9" />
      </View>

      <FlatList
        data={rootComments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          commentsLoading ? (
            <View className="items-center pt-12">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View className="items-center pt-12 px-8">
              <Text className="text-4xl mb-3">💬</Text>
              <Text
                className="text-[18px] font-bold mb-1.5"
                style={{ color: colors.foreground }}
              >
                No replies yet
              </Text>
              <Text
                className="text-sm text-center"
                style={{ color: colors.mutedForeground }}
              >
                Be the first to reply to this post
              </Text>
            </View>
          )
        }
      />

      {/* Composer */}
      {user && (
        <View
          className="flex-row items-center px-3.5 pt-2.5 gap-2.5 border-t"
          style={{
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 16 : 8),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          }}
        >
          <UserAvatar uri={user?.avatarUrl} size={36} />
          <TextInput
            ref={inputRef}
            className="flex-1 text-[15px] min-h-[38px] max-h-[100px] outline-none"
            style={{
              paddingTop: Platform.OS === "ios" ? 8 : 4,
              color: colors.foreground,
            }}
            placeholder={
              replyTarget ? `Reply to @${replyTarget.username}…` : "Post your reply"
            }
            placeholderTextColor={colors.mutedForeground}
            value={replyText}
            onChangeText={setReplyText}
            numberOfLines={1}
            maxLength={280}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!replyText.trim() || isSubmittingComment}
            activeOpacity={0.85}
            className="px-4 py-2 rounded-full items-center justify-center min-w-[68px]"
            style={{
              backgroundColor:
                replyText.trim() && !isSubmittingComment
                  ? colors.primary
                  : colors.muted,
              opacity: isSubmittingComment ? 0.7 : 1,
            }}
          >
            {isSubmittingComment ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">Reply</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Comment Item ──────────────────────────────────────────────────────────────
interface CommentItemProps {
  comment: CommentWithReplies;
  isTargeted: boolean;
  onReply: (id: string, username: string) => void;
  onNavigate: (id: string) => void;
  onProfileNavigate: (id: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  isTargeted,
  onReply,
  onNavigate,
  onProfileNavigate,
  depth = 0,
}: CommentItemProps) {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasReplies = comment.replies.length > 0;
  const avatarSize = depth > 0 ? REPLY_AVATAR_SIZE : PARENT_AVATAR_SIZE;

  return (
    <View
      style={{
        backgroundColor: isTargeted ? colors.primary + "10" : colors.background,
      }}
    >
      {/* ── Main comment row ── */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 14,
          paddingTop: depth > 0 ? REPLY_ROW_TOP_PAD : 12,
          paddingBottom: hasReplies && isExpanded ? 0 : 0,
        }}
      >
        {/* Left gutter */}
        <View
          style={{
            width: GUTTER_WIDTH,
            marginRight: GUTTER_GAP,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <TouchableOpacity
            onPress={() => onProfileNavigate(comment.author.id)}
            activeOpacity={0.85}
          >
            <UserAvatar uri={comment.author.avatarUrl} size={avatarSize} />
          </TouchableOpacity>

          {/* Straight line below avatar when this comment has visible replies */}
          {hasReplies && isExpanded && (
            <StraightLine color={colors.border} />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingBottom: 10 }}>
          {/* Meta */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            <TouchableOpacity
              onPress={() => onProfileNavigate(comment.author.id)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text
                  style={{
                    fontSize: depth > 0 ? 12 : 14,
                    fontWeight: "700",
                    color: colors.foreground,
                    maxWidth: 110,
                  }}
                  numberOfLines={1}
                >
                  {comment.author.displayName}
                </Text>
                {comment.author.isVerified && (
                  <HugeiconsIcon
                    icon={CheckmarkBadge01Icon}
                    size={depth > 0 ? 12 : 13}
                    color={colors.primary}
                  />
                )}
              </View>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: depth > 0 ? 11 : 13,
                color: colors.mutedForeground,
                marginLeft: 4,
              }}
              numberOfLines={1}
            >
              @{comment.author.username}
            </Text>
            <Text
              style={{ fontSize: depth > 0 ? 11 : 13, color: colors.mutedForeground, marginHorizontal: 4 }}
            >
              ·
            </Text>
            <Text style={{ fontSize: depth > 0 ? 11 : 13, color: colors.mutedForeground }}>
              {timeAgo(comment.createdAt)}
            </Text>
          </View>

          {/* Comment text */}
          <TouchableOpacity onPress={() => onNavigate(comment.id)} activeOpacity={0.9}>
            <Text
              style={{
                fontSize: depth > 0 ? 13 : 14,
                lineHeight: 20,
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              {comment.content}
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => onReply(comment.id, comment.author.username)}
              activeOpacity={0.7}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <HugeiconsIcon
                icon={AiChatIcon}
                size={depth > 0 ? 14 : 16}
                strokeWidth={2}
                color={isTargeted ? colors.primary : colors.mutedForeground}
              />
              {comment.repliesCount > 0 && (
                <Text
                  style={{
                    fontSize: depth > 0 ? 11 : 12,
                    color: isTargeted ? colors.primary : colors.mutedForeground,
                  }}
                >
                  {fmtCount(comment.repliesCount)}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <HugeiconsIcon
                icon={Share01Icon}
                size={depth > 0 ? 14 : 16}
                strokeWidth={2}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* "View replies" toggle — only for root comments */}
          {hasReplies && !isExpanded && (
            <TouchableOpacity
              onPress={() => setIsExpanded(true)}
              style={{ marginTop: 10, paddingVertical: 2 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                {comment.replies.length > 1
                  ? `View ${comment.replies.length} replies`
                  : "View reply"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Nested replies ── */}
      {isExpanded && hasReplies && (
        <View
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }}
        >
          {/* Show only the FIRST reply initially as per requirement */}
          <View key={comment.replies[0].id}>
            {/* Curved connector SVG sits in the gutter column */}
            <View
              style={{
                flexDirection: "row",
                paddingLeft: 14,
                alignItems: "flex-start",
              }}
            >
              {/* Gutter: curved line only */}
              <View
                style={{
                  width: GUTTER_WIDTH,
                  marginRight: GUTTER_GAP,
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <CurvedConnector color={colors.border} />
              </View>

              {/* Reply content */}
              <View className='ml-[-5px] pb-4' style={{ flex: 1 }}>
                <CommentItem
                  comment={comment.replies[0]}
                  isTargeted={isTargeted}
                  onReply={onReply}
                  onNavigate={onNavigate}
                  onProfileNavigate={onProfileNavigate}
                  depth={depth + 1}
                />
              </View>
            </View>
          </View>

          {/* If more than 1 reply, show "See more" which redirects to this post (comment) */}
          {comment.replies.length > 1 && (
            <TouchableOpacity
              onPress={() => onNavigate(comment.id)}
              style={{
                flexDirection: "row",
                paddingLeft: 14 + GUTTER_WIDTH + GUTTER_GAP,
                paddingBottom: 12,
                marginTop: -4
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                See more replies
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bottom border after the whole comment+replies block */}
      {(!hasReplies || !isExpanded) && (
        <View
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }}
        />
      )}
    </View>
  );
}