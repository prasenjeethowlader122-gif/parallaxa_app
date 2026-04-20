import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Heart01Icon,
  MessageCircle01Icon,
  Share01Icon,
  CheckmarkBadge01Icon,
  Bookmark01Icon,
  MoreHorizontalIcon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetPost,
  useCreatePost,
  useLikePost,
  useUnlikePost,
} from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { getApiBaseUrl } from "@/lib/apiUrl";

const { width } = Dimensions.get("window");

// ── Design Tokens (X / Twitter Light) ───────────────────────────────────────
const X = {
  bg: "#FFFFFF",
  bgSecondary: "#F7F9F9",
  border: "#EFF3F4",
  borderStrong: "#CFD9DE",
  text: "#0F1419",
  textSub: "#536471",
  blue: "#1D9BF0",
  blueLight: "#E8F5FD",
  red: "#F4212E",
  green: "#00BA7C",
  verified: "#1D9BF0",
  pill: "rgba(29,155,240,0.12)",
};

// ── Type Guard ───────────────────────────────────────────────────────────────
function isValidPost(post: any): post is Post {
  return post && post.id && post.author && post.author.username;
}

// ── Custom hook: fetch replies ───────────────────────────────────────────────
function useGetReplies(postId: string) {
  const [data, setData] = useState<{ posts: Post[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refetch = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const token = (user as any)?._token ?? "";
      const res = await fetch(`${baseUrl}/api/posts/${postId}/replies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (_) {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, refetch };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "just now";
  
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown time";
  
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
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    postId: string;
    username: string;
  } | null>(null);

  const { data: post, isLoading: postLoading } = useGetPost(id ?? "");
  const { data: repliesData, refetch: refetchReplies } = useGetReplies(id ?? "");

  const { mutate: createPost, isPending: replyPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        setReplyText("");
        setReplyTarget(null);
        refetchReplies();
      },
    },
  });

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const isLiked = localLiked !== null ? localLiked : (post?.isLiked ?? false);
  const likesCount = localCount !== null ? localCount : (post?.likesCount ?? 0);

  const handleLike = useCallback(() => {
    const newLiked = !isLiked;
    setLocalLiked(newLiked);
    setLocalCount(likesCount + (newLiked ? 1 : -1));
    if (newLiked) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id, likePost, unlikePost]);

  const openReply = useCallback(
    (postId: string, username: string) => {
      setReplyTarget(
        replyTarget?.postId === postId ? null : { postId, username }
      );
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [replyTarget]
  );

  const handleSend = useCallback(() => {
    if (!replyText.trim() || replyPending) return;
    createPost({
      data: {
        content: replyText.trim(),
        parentPostId: replyTarget?.postId ?? id!,
      } as any,
    });
  }, [replyText, replyPending, replyTarget, id, createPost]);

  // SAFER replies array
  const replies: Post[] = repliesData?.posts?.filter(isValidPost) ?? [];
  
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  // ── Loading & Error States ──────────────────────────────────────────────────
  if (postLoading || !post || !isValidPost(post)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={X.blue} />
      </View>
    );
  }

  // ── List Header ────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Nav */}
      <View className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-b-[#EFF3F4]" style={{ paddingTop: topPad + 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            strokeWidth={2.2}
            color={X.text}
          />
        </TouchableOpacity>
        <Text className="text-base font-bold text-[#0F1419] -tracking-[0.3px]">Post</Text>
        <View className="w-9" />
      </View>

      {/* Author row */}
      <View className="flex-row items-center px-4 pt-4 pb-1 gap-x-2.5">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${post.author.id}` as any)}
          activeOpacity={0.85}
        >
          <UserAvatar uri={post.author.avatarUrl} size={44} />
        </TouchableOpacity>

        <View className="flex-1">
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center">
              <Text className="text-[15px] font-bold text-[#0F1419] -tracking-[0.2px] mr-0.5" numberOfLines={1}>
                {post.author.displayName ?? post.author.username}
              </Text>
              {post.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={16}
                  color={X.verified}
                />
              )}
            </View>
            <Text className="text-[14px] text-[#536471] mt-0.5">@{post.author.username}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="w-9 h-9 rounded-full items-center justify-center active:opacity-70" hitSlop={8}>
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={18}
            strokeWidth={2}
            color={X.textSub}
          />
        </TouchableOpacity>
      </View>

      {/* Post content */}
      {post.content ? (
        <Text className="text-[20px] leading-[28px] text-[#0F1419] -tracking-[0.2px] px-4 pt-3 pb-2">{post.content}</Text>
      ) : null}

      {/* Post image */}
      {post.imageUrl ? (
        <View className="px-4 pb-2">
          <Image
            source={{ uri: post.imageUrl }}
            className="w-[calc(100vw-32px)] h-[calc(100vw-32px)*0.5625] rounded-3xl"
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Timestamp */}
      <Text className="text-[14px] text-[#536471] px-4 py-3 border-t border-t-[#EFF3F4] border-b border-b-[#EFF3F4]">
        {formatFullDate(post.createdAt as unknown as string)}
      </Text>

      {/* Stats row */}
      {(likesCount > 0 || (post.repliesCount ?? 0) > 0 || (post.commentsCount ?? 0) > 0) ? (
        <View className="flex-row gap-x-4 px-4 py-3 border-b border-b-[#EFF3F4]">
          {((post.repliesCount ?? 0) > 0 || (post.commentsCount ?? 0) > 0) ? (
            <View className="flex-row items-baseline">
              <Text className="text-[14px] font-bold text-[#0F1419]">
                {fmtCount(post.repliesCount ?? post.commentsCount ?? 0)}
              </Text>
              <Text className="text-[14px] text-[#536471]"> Replies</Text>
            </View>
          ) : null}
          {likesCount > 0 ? (
            <View className="flex-row items-baseline">
              <Text className="text-[14px] font-bold text-[#0F1419]">{fmtCount(likesCount)}</Text>
              <Text className="text-[14px] text-[#536471]">
                {likesCount === 1 ? " Like" : " Likes"}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Action bar */}
      <View className="flex-row px-2 py-0.5 border-b border-b-[#EFF3F4]">
        <ActionBtn
          icon={MessageCircle01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={replyTarget?.postId === id}
          onPress={() => openReply(id!, post.author.username)}
        />
        <ActionBtn
          icon={ArrowUp01Icon}
          color={X.textSub}
          activeColor={X.green}
          active={false}
          onPress={() => {}}
        />
        <ActionBtn
          icon={Heart01Icon}
          color={X.textSub}
          activeColor={X.red}
          active={isLiked}
          onPress={handleLike}
        />
        <ActionBtn
          icon={Bookmark01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={isSaved}
          onPress={() => setIsSaved((v) => !v)}
        />
        <ActionBtn
          icon={Share01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={false}
          onPress={() => {}}
        />
      </View>

      {/* Replies header */}
      <View className="px-4 py-2.5 border-b border-b-[#EFF3F4] bg-[#F7F9F9]">
        <Text className="text-xs font-bold text-[#536471] tracking-[0.8px] uppercase">Replies</Text>
      </View>

      {/* Replying-to banner */}
      {replyTarget ? (
        <View className="flex-row items-center justify-between px-4 py-2 bg-[#E8F5FD] border-b border-b-[#EFF3F4]">
          <Text className="text-[13px] text-[#536471]">
            Replying to{" "}
            <Text className="text-[#1D9BF0]">@{replyTarget.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTarget(null)} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-[#1D9BF0]">Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  // ── Render reply item ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Post }) => {
    if (!isValidPost(item)) return null;
    return (
      <ReplyItem
        reply={item}
        isTargeted={replyTarget?.postId === item.id}
        onReply={() => openReply(item.id, item.author.username)}
        onAuthorPress={() => router.push(`/profile/${item.author.id}` as any)}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <View className="items-center pt-12 px-8">
            <Text className="text-3xl mb-3">💬</Text>
            <Text className="text-lg font-bold text-[#0F1419] mb-1.5">No replies yet</Text>
            <Text className="text-[14px] text-[#536471] text-center">Be the first to reply to this post</Text>
          </View>
        }
      />

      {/* Reply composer */}
      <View
        className="flex-row items-center px-3.5 pt-2.5 gap-x-2.5 border-t border-t-[#EFF3F4] bg-white"
        style={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 16 : 8),
        }}
      >
        <UserAvatar uri={user?.avatarUrl} size={36} />
        <TextInput
          ref={inputRef}
          className="flex-1 text-[15px] text-[#0F1419] min-h-[38px] max-h-24 pt-2 ios:pt-2 android:pt-1"
          placeholder={
            replyTarget
              ? `Reply to @${replyTarget.username}…`
              : "Post your reply"
          }
          placeholderTextColor={X.textSub}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!replyText.trim() || replyPending}
          activeOpacity={0.85}
          className="px-4.5 py-2.25 rounded-5.5 items-center justify-center min-w-[68px] bg-[#1D9BF0] disabled:bg-[#CFD9DE]"
        >
          {replyPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-[14px] font-bold text-white">Reply</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Action button helper ─────────────────────────────────────────────────────
interface ActionBtnProps {
  icon: any;
  color: string;
  activeColor: string;
  active: boolean;
  onPress: () => void;
}

function ActionBtn({ icon, color, activeColor, active, onPress }: ActionBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-1 items-center py-2.5"
      hitSlop={8}
    >
      <HugeiconsIcon
        icon={icon}
        size={20}
        strokeWidth={active ? 0 : 1.75}
        color={active ? activeColor : color}
      />
    </TouchableOpacity>
  );
}

// ── Reply Item (FULLY SAFE) ──────────────────────────────────────────────────
interface ReplyItemProps {
  reply: Post;
  isTargeted: boolean;
  onReply: () => void;
  onAuthorPress: () => void;
}

function ReplyItem({ reply, isTargeted, onReply, onAuthorPress }: ReplyItemProps) {
  // SAFETY FIRST: Early return if invalid
  if (!reply || !reply.author || !reply.author.username) {
    return null;
  }

  const [liked, setLiked] = useState(reply.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(reply.likesCount ?? 0);

  const handleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
  }, [liked]);

  return (
    <View className={`flex-row pl-3.5 pr-3.5 pt-3 pb-3 border-b border-b-[#EFF3F4] bg-white gap-x-2.5 ${isTargeted ? 'bg-[#E8F5FD]' : ''}`}>
      {/* Left: avatar + thread line */}
      <View className="items-center w-10">
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.85}>
          <UserAvatar uri={reply.author.avatarUrl ?? undefined} size={38} />
        </TouchableOpacity>
        <View className="w-[2px] flex-1 mt-1.5 min-h-5 bg-[#EFF3F4] rounded" />
      </View>

      {/* Right: content */}
      <View className="flex-1 pb-3">
        {/* Meta */}
        <View className="flex-row items-center mb-0.75 flex-nowrap">
          <TouchableOpacity
            onPress={onAuthorPress}
            activeOpacity={0.85}
            className="flex-shrink"
          >
            <View className="flex-row items-center gap-x-0.75">
              <Text className="text-[14px] font-bold text-[#0F1419] max-w-[110px]" numberOfLines={1}>
                {reply.author.displayName ?? reply.author.username ?? 'Unknown'}
              </Text>
              {reply.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={13}
                  color={X.verified}
                />
              )}
            </View>
          </TouchableOpacity>
          <Text className="text-[13px] text-[#536471] flex-shrink" numberOfLines={1}>
            {"  "}@{reply.author.username}
          </Text>
          <Text className="text-[13px] text-[#536471] mx-0.75">·</Text>
          <Text className="text-[13px] text-[#536471]">
            {timeAgo(reply.createdAt as unknown as string)}
          </Text>
          <TouchableOpacity
            className="ml-auto"
            activeOpacity={0.7}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={15}
              strokeWidth={2}
              color={X.textSub}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {reply.content ? (
          <Text className="text-[14px] leading-5 text-[#0F1419] mb-2">{reply.content}</Text>
        ) : null}

        {/* Reply image */}
        {reply.imageUrl ? (
          <Image
            source={{ uri: reply.imageUrl }}
            className="w-full h-[180px] rounded-3xl mb-2"
            resizeMode="cover"
          />
        ) : null}

        {/* Reply actions */}
        <View className="flex-row gap-x-6 items-center pt-0.5">
          <TouchableOpacity
            onPress={onReply}
            className="flex-row items-center gap-x-1.25 active:opacity-70"
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={MessageCircle01Icon}
              size={16}
              strokeWidth={1.75}
              color={isTargeted ? X.blue : X.textSub}
            />
            {(reply.repliesCount ?? 0) > 0 && (
              <Text className={`text-xs ${isTargeted ? 'text-[#1D9BF0]' : 'text-[#536471]'}`}>
                {fmtCount(reply.repliesCount ?? 0)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLike}
            className="flex-row items-center gap-x-1.25 active:opacity-70"
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={Heart01Icon}
              size={16}
              strokeWidth={liked ? 0 : 1.75}
              color={liked ? X.red : X.textSub}
            />
            {likeCount > 0 && (
              <Text className={`text-xs ${liked ? 'text-[#F4212E]' : 'text-[#536471]'}`}>
                {fmtCount(likeCount)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-x-1.25 active:opacity-70"
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={Share01Icon}
              size={16}
              strokeWidth={1.75}
              color={X.textSub}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}