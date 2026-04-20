import React, { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
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
  useGetComments,
  useCreateComment,
  useSavePost,
  useUnsavePost,
  Comment,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

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

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string | null;
    username: string;
  } | null>(null);

  const { data: post, isLoading: postLoading, refetch: refetchPost } = useGetPost(id ?? "");
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useGetComments(id ?? "");

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: unsavePost } = useUnsavePost();
  const { mutate: createComment, isPending: isSubmittingComment } = useCreateComment();

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);

  const isLiked = localLiked !== null ? localLiked : (post?.isLiked ?? false);
  const likesCount = localCount !== null ? localCount : (post?.likesCount ?? 0);
  const isSaved = localSaved !== null ? localSaved : (post?.isSaved ?? false);

  const handleLike = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isLiked;
    setLocalLiked(next);
    setLocalCount(likesCount + (next ? 1 : -1));
    if (next) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id, likePost, unlikePost]);

  const handleSave = useCallback(() => {
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
    if (!text || !id) return;

    createComment({
      postId: id,
      data: {
        content: text,
        parentId: replyTarget?.commentId ?? undefined,
      }
    }, {
      onSuccess: () => {
        setReplyText("");
        setReplyTarget(null);
        refetchComments();
        refetchPost();
      }
    });
  }, [replyText, replyTarget, id, createComment, refetchComments, refetchPost]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (postLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const comments = commentsData?.comments ?? [];

  // ── List Header ───────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.background,
          borderBottomColor: colors.border
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
        <Text className="text-[17px] font-bold tracking-tight" style={{ color: colors.foreground }}>
          Post
        </Text>
        <View className="w-9" />
      </View>

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
            className="w-full rounded-2xl"
            style={{ aspectRatio: 16 / 9, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}
            resizeMode="cover"
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
        <View className="flex-row gap-4 px-4 py-3 border-b" style={{ borderColor: colors.border }}>
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
      <View className="flex-row px-2 border-b" style={{ borderColor: colors.border }}>
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
            color={replyTarget?.commentId === null ? colors.primary : colors.mutedForeground}
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
      <View
        className="px-4 py-2.5 border-b"
        style={{ backgroundColor: colors.muted, borderColor: colors.border }}
      >
        <Text
          className="text-[11px] font-bold tracking-widest uppercase"
          style={{ color: colors.mutedForeground }}
        >
          Replies
        </Text>
      </View>

      {/* Replying-to banner */}
      {replyTarget ? (
        <View
          className="flex-row items-center justify-between px-4 py-2 border-b"
          style={{ backgroundColor: colors.primary + "10", borderColor: colors.border }}
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

  const renderItem = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      isTargeted={replyTarget?.commentId === item.id}
      onReply={() => openReply(item.id, item.author.username)}
      onAuthorPress={() => router.push(`/profile/${item.author.id}` as any)}
    />
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={comments}
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
              <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
                Be the first to reply to this post
              </Text>
            </View>
          )
        }
      />

      {/* Composer */}
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
          className="flex-1 text-[15px] min-h-[38px] max-h-[100px]"
          style={{
            paddingTop: Platform.OS === "ios" ? 8 : 4,
            color: colors.foreground
          }}
          placeholder={
            replyTarget
              ? `Reply to @${replyTarget.username}…`
              : "Post your reply"
          }
          placeholderTextColor={colors.mutedForeground}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!replyText.trim() || isSubmittingComment}
          activeOpacity={0.85}
          className="px-4 py-2 rounded-full items-center justify-center min-w-[68px]"
          style={{
            backgroundColor: replyText.trim() && !isSubmittingComment ? colors.primary : colors.muted,
            opacity: isSubmittingComment ? 0.7 : 1
          }}
        >
          {isSubmittingComment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-sm font-bold text-white">Reply</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Comment Item ──────────────────────────────────────────────────────────────
interface CommentItemProps {
  comment: Comment;
  isTargeted: boolean;
  onReply: () => void;
  onAuthorPress: () => void;
}

function CommentItem({
  comment,
  isTargeted,
  onReply,
  onAuthorPress,
}: CommentItemProps) {
  const colors = useColors();

  return (
    <View
      className="flex-row pl-3.5 pr-3.5 pt-3 border-b gap-2.5"
      style={{
        backgroundColor: isTargeted ? colors.primary + "10" : colors.background,
        borderBottomColor: colors.border
      }}
    >
      {/* Left column: avatar + thread line */}
      <View className="items-center w-10">
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.85}>
          <UserAvatar uri={comment.author.avatarUrl} size={38} />
        </TouchableOpacity>
        <View
          className="w-0.5 flex-1 mt-1.5 min-h-5 rounded-full"
          style={{ backgroundColor: colors.border }}
        />
      </View>

      {/* Right column: content */}
      <View className="flex-1 pb-3">
        {/* Meta */}
        <View className="flex-row items-center mb-0.5">
          <TouchableOpacity
            onPress={onAuthorPress}
            activeOpacity={0.85}
            className="shrink"
          >
            <View className="flex-row items-center gap-0.5">
              <Text
                className="text-[14px] font-bold max-w-[110px]"
                style={{ color: colors.foreground }}
                numberOfLines={1}
              >
                {comment.author.displayName}
              </Text>
              {comment.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={13}
                  color={colors.primary}
                />
              )}
            </View>
          </TouchableOpacity>
          <Text
            className="text-[13px] shrink ml-1"
            style={{ color: colors.mutedForeground }}
            numberOfLines={1}
          >
            @{comment.author.username}
          </Text>
          <Text className="text-[13px] mx-1" style={{ color: colors.mutedForeground }}>·</Text>
          <Text className="text-[13px]" style={{ color: colors.mutedForeground }}>
            {timeAgo(comment.createdAt)}
          </Text>
          <TouchableOpacity className="ml-auto" activeOpacity={0.7} hitSlop={8}>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={15}
              strokeWidth={2}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Comment text */}
        <Text
          className="text-[14px] leading-5 mb-2"
          style={{ color: colors.foreground }}
        >
          {comment.content}
        </Text>

        {/* Actions */}
        <View className="flex-row gap-6 items-center pt-0.5">
          {/* Reply */}
          <TouchableOpacity
            onPress={onReply}
            activeOpacity={0.7}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            <HugeiconsIcon
              icon={AiChatIcon}
              size={16}
              strokeWidth={2}
              color={isTargeted ? colors.primary : colors.mutedForeground}
            />
            {comment.repliesCount > 0 && (
              <Text
                className="text-[12px]"
                style={{ color: isTargeted ? colors.primary : colors.mutedForeground }}
              >
                {fmtCount(comment.repliesCount)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={8}
            className="flex-row items-center"
          >
            <HugeiconsIcon
              icon={Share01Icon}
              size={16}
              strokeWidth={2}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}