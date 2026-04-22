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
  useGetReplies,
  useCreatePost,
  useSavePost,
  useUnsavePost,
  Post,
  getGetRepliesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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

// ── Tree Logic ────────────────────────────────────────────────────────────────
type CommentWithReplies = Post & { replies: CommentWithReplies[] };

function buildCommentTree(flatComments: Post[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  // Sort by date to ensure stable order
  const sorted = [...flatComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

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
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useGetReplies(id ?? "");

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: unsavePost } = useUnsavePost();
  const { mutate: createPost, isPending: isSubmittingComment } = useCreatePost({
    mutation: {
      onMutate: async (variables) => {
        const text = variables.data.content?.trim();
        const parentId = variables.data.parentPostId;
        if (!text || !id || !user) return;

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: getGetRepliesQueryKey(id) });

        // Snapshot the previous value
        const previousComments = queryClient.getQueryData(getGetRepliesQueryKey(id));

        // Optimistically update to the new value
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
      }
    }
  });

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
    if (!text || !id || !user) return;

    const parentId = replyTarget?.commentId ?? id;

    createPost({
      data: {
        content: text,
        parentPostId: parentId,
      }
    }, {
      onSuccess: () => {
        setReplyText("");
        setReplyTarget(null);
      }
    });
  }, [replyText, replyTarget, id, user, createPost, queryClient, refetchPost]);

  const topPad = insets.top + (Platform.OS === "web" ? 20 : 8);

  if (postLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const comments = commentsData?.posts ?? [];
  const rootComments = React.useMemo(() => buildCommentTree(comments), [comments]);

  // ── List Header ───────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b"
        style={{
          paddingTop: topPad,
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
          style={{ color: colors.mutedForeground, borderColor: '#f2f2f2' }}
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
      <View className="flex-row px-2 border-b" style={{ borderColor: '#f2f2f2' }}>
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
  const navigateToPost = (postId: string) => router.push(`/post/${postId}` as any);

  const renderItem = ({ item }: { item: CommentWithReplies }) => (
    <CommentItem
      comment={item}
      isTargeted={replyTarget?.commentId === item.id}
      onReply={openReply}
      onAuthorPress={navigateToPost}
      depth={0}
    />
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
  comment: CommentWithReplies;
  isTargeted: boolean;
  onReply: (id: string, username: string) => void;
  onAuthorPress: (id: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  isTargeted,
  onReply,
  onAuthorPress,
  depth = 0,
}: CommentItemProps) {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasReplies = comment.replies.length > 0;
  const showSeeMore = hasReplies && !isExpanded;

  return (
    <View
      style={{
        backgroundColor: isTargeted ? colors.primary + "10" : colors.background,
        paddingLeft: depth > 0 ? 12 : 0,
      }}
    >
      <View
        className="flex-row pl-3.5 pr-3.5 pt-3 gap-2.5"
        style={{
          borderBottomWidth: !hasReplies || !isExpanded ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border
        }}
      >
        {/* Left column: avatar + thread line */}
        <View className="items-center w-10">
          <TouchableOpacity onPress={() => onAuthorPress(comment.author.id)} activeOpacity={0.85}>
            <UserAvatar uri={comment.author.avatarUrl} size={depth > 0 ? 32 : 38} />
          </TouchableOpacity>
          {((hasReplies && isExpanded) || depth > 0) && (
            <View
              className="w-0.5 flex-1 mt-1.5 min-h-[10px] rounded-full"
              style={{ backgroundColor: colors.border, marginBottom: (hasReplies && isExpanded) ? 0 : 12 }}
            />
          )}
        </View>

        {/* Right column: content */}
        <View className="flex-1 pb-3">
          {/* Meta */}
          <View className="flex-row items-center mb-0.5">
            <TouchableOpacity
              onPress={() => onAuthorPress(comment.author.id)}
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
            <TouchableOpacity
              onPress={() => onReply(comment.id, comment.author.username)}
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

          {showSeeMore && (
            <TouchableOpacity
              onPress={() => setIsExpanded(true)}
              className="mt-3 py-1"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                {comment.replies.length > 1 ? "See More" : "View reply"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Nested Replies */}
      {isExpanded && hasReplies && (
        <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
          {comment.replies.map((reply: CommentWithReplies) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isTargeted={isTargeted}
              onReply={onReply}
              onAuthorPress={onAuthorPress}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}