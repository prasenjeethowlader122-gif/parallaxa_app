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
} from "react-native";
import { Text } from "@/components/Text";
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
  useLikePost,
  useUnlikePost,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

// ── Mock comment type ─────────────────────────────────────────────────────────
interface MockComment {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  content: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  isLiked: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_COMMENTS: MockComment[] = [
  {
    id: "c1",
    author: {
      id: "u1",
      username: "elonmusk",
      displayName: "Elon Musk",
      avatarUrl: "https://i.pravatar.cc/150?img=11",
      isVerified: true,
    },
    content: "This is absolutely wild. The implications for the next decade are huge 🚀",
    likesCount: 4821,
    repliesCount: 312,
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    isLiked: false,
  },
  {
    id: "c2",
    author: {
      id: "u2",
      username: "sama",
      displayName: "Sam Altman",
      avatarUrl: "https://i.pravatar.cc/150?img=33",
      isVerified: true,
    },
    content:
      "Agreed. We've been working on something very similar internally. Exciting times ahead for everyone in this space.",
    likesCount: 2103,
    repliesCount: 87,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    isLiked: true,
  },
  {
    id: "c3",
    author: {
      id: "u3",
      username: "karpathy",
      displayName: "Andrej Karpathy",
      avatarUrl: "https://i.pravatar.cc/150?img=52",
      isVerified: true,
    },
    content:
      "The neural scaling laws here are particularly interesting. Would love to see the full ablation study on tokenizer choice.",
    likesCount: 1540,
    repliesCount: 44,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    isLiked: false,
  },
  {
    id: "c4",
    author: {
      id: "u4",
      username: "naval",
      displayName: "Naval",
      avatarUrl: "https://i.pravatar.cc/150?img=60",
      isVerified: false,
    },
    content:
      "First principles: if compute doubles every 18 months and we're training on all human knowledge... the math speaks for itself.",
    likesCount: 987,
    repliesCount: 56,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isLiked: false,
  },
  {
    id: "c5",
    author: {
      id: "u5",
      username: "lexfridman",
      displayName: "Lex Fridman",
      avatarUrl: "https://i.pravatar.cc/150?img=7",
      isVerified: true,
    },
    content:
      "Would love to have you on the podcast to discuss this further. The world needs to hear more nuanced takes on AI development.",
    likesCount: 3410,
    repliesCount: 211,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isLiked: true,
  },
  {
    id: "c6",
    author: {
      id: "u6",
      username: "paulg",
      displayName: "Paul Graham",
      avatarUrl: "https://i.pravatar.cc/150?img=15",
      isVerified: false,
    },
    content:
      "What most people miss: it's not about replacing humans, it's about amplifying what humans can accomplish. Every great technology follows this pattern.",
    likesCount: 2876,
    repliesCount: 134,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isLiked: false,
  },
  {
    id: "c7",
    author: {
      id: "u7",
      username: "balajis",
      displayName: "Balaji Srinivasan",
      avatarUrl: "https://i.pravatar.cc/150?img=22",
      isVerified: false,
    },
    content:
      "Network states + AI = the most underrated macro trend of the decade. Sovereignties will be redefined.",
    likesCount: 654,
    repliesCount: 29,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isLiked: false,
  },
];

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [comments, setComments] = useState<MockComment[]>(MOCK_COMMENTS);
  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string | null;
    username: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const { data: post, isLoading: postLoading } = useGetPost(id ?? "");
  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);

  const isLiked = localLiked !== null ? localLiked : (post?.isLiked ?? false);
  const likesCount = localCount !== null ? localCount : (post?.likesCount ?? 0);

  const handleLike = useCallback(() => {
    const next = !isLiked;
    setLocalLiked(next);
    setLocalCount(likesCount + (next ? 1 : -1));
    if (next) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id, likePost, unlikePost]);

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
    if (!text) return;
    const newComment: MockComment = {
      id: `local-${Date.now()}`,
      author: {
        id: (user as any)?.id ?? "me",
        username: (user as any)?.username ?? "you",
        displayName: (user as any)?.displayName ?? "You",
        avatarUrl:
          (user as any)?.avatarUrl ?? "https://i.pravatar.cc/150?img=3",
        isVerified: false,
      },
      content: replyTarget ? `@${replyTarget.username} ${text}` : text,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setReplyText("");
    setReplyTarget(null);
  }, [replyText, replyTarget, user]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (postLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D9BF0" />
      </View>
    );
  }

  // ── List Header ───────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-[#EFF3F4]"
        style={{ paddingTop: topPad + 12 }}
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
            color="#0F1419"
          />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-[#0F1419] tracking-tight">
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
                className="text-[15px] font-bold text-[#0F1419] tracking-tight"
                numberOfLines={1}
              >
                {post.author.displayName ?? post.author.username}
              </Text>
              {post.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={16}
                  color="#1D9BF0"
                />
              )}
            </View>
            <Text className="text-sm text-[#536471] mt-0.5">
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
              color="#536471"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Post content */}
      {post?.content ? (
        <Text className="text-[20px] leading-[28px] text-[#0F1419] tracking-tight px-4 pt-3 pb-2">
          {post.content}
        </Text>
      ) : null}

      {/* Post image */}
      {post?.imageUrl ? (
        <View className="px-4 pb-2">
          <Image
            source={{ uri: post.imageUrl }}
            className="w-full rounded-2xl"
            style={{ aspectRatio: 16 / 9 }}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Timestamp */}
      {post?.createdAt ? (
        <Text className="text-sm text-[#536471] px-4 py-3 border-t border-b border-[#EFF3F4]">
          {formatFullDate(post.createdAt as unknown as string)}
        </Text>
      ) : null}

      {/* Stats row */}
      {(likesCount > 0 || (post?.repliesCount ?? 0) > 0) ? (
        <View className="flex-row gap-4 px-4 py-3 border-b border-[#EFF3F4]">
          {(post?.repliesCount ?? 0) > 0 && (
            <Text className="text-sm text-[#536471]">
              <Text className="font-bold text-[#0F1419]">
                {fmtCount(post?.repliesCount ?? 0)}
              </Text>
              {" Replies"}
            </Text>
          )}
          {likesCount > 0 && (
            <Text className="text-sm text-[#536471]">
              <Text className="font-bold text-[#0F1419]">
                {fmtCount(likesCount)}
              </Text>
              {likesCount === 1 ? " Like" : " Likes"}
            </Text>
          )}
        </View>
      ) : null}

      {/* Action bar */}
      <View className="flex-row px-2 border-b border-[#EFF3F4]">
        <TouchableOpacity
          onPress={() => openReply(null, post?.author?.username ?? "")}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={MessageCircle01Icon}
            size={20}
            strokeWidth={replyTarget?.commentId === null ? 0 : 1.75}
            color={replyTarget?.commentId === null ? "#1D9BF0" : "#536471"}
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
            strokeWidth={1.75}
            color="#536471"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={Heart01Icon}
            size={20}
            strokeWidth={isLiked ? 0 : 1.75}
            color={isLiked ? "#F4212E" : "#536471"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSaved((v) => !v)}
          activeOpacity={0.7}
          hitSlop={8}
          className="flex-1 items-center py-2.5"
        >
          <HugeiconsIcon
            icon={Bookmark01Icon}
            size={20}
            strokeWidth={isSaved ? 0 : 1.75}
            color={isSaved ? "#1D9BF0" : "#536471"}
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
            strokeWidth={1.75}
            color="#536471"
          />
        </TouchableOpacity>
      </View>

      {/* Replies label */}
      <View className="px-4 py-2.5 bg-[#F7F9F9] border-b border-[#EFF3F4]">
        <Text className="text-[11px] font-bold text-[#536471] tracking-widest uppercase">
          Replies
        </Text>
      </View>

      {/* Replying-to banner */}
      {replyTarget ? (
        <View className="flex-row items-center justify-between px-4 py-2 bg-[#E8F5FD] border-b border-[#EFF3F4]">
          <Text className="text-[13px] text-[#536471]">
            Replying to{" "}
            <Text className="text-[#1D9BF0]">@{replyTarget.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTarget(null)} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-[#1D9BF0]">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderItem = ({ item }: { item: MockComment }) => (
    <CommentItem
      comment={item}
      isTargeted={replyTarget?.commentId === item.id}
      onReply={() => openReply(item.id, item.author.username)}
      onAuthorPress={() => router.push(`/profile/${item.author.id}` as any)}
    />
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        
        keyExtractor={(item) => item.id}
      
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <View className="items-center pt-12 px-8">
            <Text className="text-4xl mb-3">💬</Text>
            <Text className="text-[18px] font-bold text-[#0F1419] mb-1.5">
              No replies yet
            </Text>
            <Text className="text-sm text-[#536471] text-center">
              Be the first to reply to this post
            </Text>
          </View>
        }
      />

      {/* Composer */}
      <View
        className="flex-row items-center px-3.5 pt-2.5 gap-2.5 border-t border-[#EFF3F4] bg-white"
        style={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 16 : 8),
        }}
      >
        <UserAvatar uri={user?.avatarUrl} size={36} />
        <TextInput
          ref={inputRef}
          className="flex-1 text-[15px] text-[#0F1419] min-h-[38px] max-h-[100px]"
          style={{ paddingTop: Platform.OS === "ios" ? 8 : 4 }}
          placeholder={
            replyTarget
              ? `Reply to @${replyTarget.username}…`
              : "Post your reply"
          }
          placeholderTextColor="#536471"
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!replyText.trim()}
          activeOpacity={0.85}
          className={`px-4 py-2 rounded-full items-center justify-center min-w-[68px] ${
            replyText.trim() ? "bg-[#1D9BF0]" : "bg-[#CFD9DE]"
          }`}
        >
          <Text className="text-sm font-bold text-white">Reply</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Comment Item ──────────────────────────────────────────────────────────────
interface CommentItemProps {
  comment: MockComment;
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
  const [liked, setLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likesCount);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
  };

  return (
    <View
      className={`flex-row pl-3.5 pr-3.5 pt-3 border-b border-[#EFF3F4] gap-2.5 ${
        isTargeted ? "bg-[#E8F5FD]" : "bg-white"
      }`}
    >
      {/* Left column: avatar + thread line */}
      <View className="items-center w-10">
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.85}>
          <UserAvatar uri={comment.author.avatarUrl} size={38} />
        </TouchableOpacity>
        <View className="w-0.5 flex-1 mt-1.5 min-h-5 bg-[#EFF3F4] rounded-full" />
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
                className="text-[14px] font-bold text-[#0F1419] max-w-[110px]"
                numberOfLines={1}
              >
                {comment.author.displayName}
              </Text>
              {comment.author.isVerified && (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={13}
                  color="#1D9BF0"
                />
              )}
            </View>
          </TouchableOpacity>
          <Text
            className="text-[13px] text-[#536471] shrink ml-1"
            numberOfLines={1}
          >
            @{comment.author.username}
          </Text>
          <Text className="text-[13px] text-[#536471] mx-1">·</Text>
          <Text className="text-[13px] text-[#536471]">
            {timeAgo(comment.createdAt)}
          </Text>
          <TouchableOpacity className="ml-auto" activeOpacity={0.7} hitSlop={8}>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={15}
              strokeWidth={2}
              color="#536471"
            />
          </TouchableOpacity>
        </View>

        {/* Comment text */}
        <Text className="text-[14px] leading-5 text-[#0F1419] mb-2">
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
              icon={MessageCircle01Icon}
              size={16}
              strokeWidth={1.75}
              color={isTargeted ? "#1D9BF0" : "#536471"}
            />
            {comment.repliesCount > 0 && (
              <Text
                className={`text-[12px] ${
                  isTargeted ? "text-[#1D9BF0]" : "text-[#536471]"
                }`}
              >
                {fmtCount(comment.repliesCount)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            onPress={handleLike}
            activeOpacity={0.7}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            <HugeiconsIcon
              icon={Heart01Icon}
              size={16}
              strokeWidth={liked ? 0 : 1.75}
              color={liked ? "#F4212E" : "#536471"}
            />
            {likeCount > 0 && (
              <Text
                className={`text-[12px] ${
                  liked ? "text-[#F4212E]" : "text-[#536471]"
                }`}
              >
                {fmtCount(likeCount)}
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
              strokeWidth={1.75}
              color="#536471"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}