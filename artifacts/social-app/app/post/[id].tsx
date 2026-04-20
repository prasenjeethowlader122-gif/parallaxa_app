import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Heart01Icon,
  MessageCircle01Icon,
  Share01Icon,
  CheckmarkBadge01Icon,
  Bookmark01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
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

// ── X / Twitter Light Theme Tokens ──────────────────────────────────────────
const X = {
  bg: "#FFFFFF",
  bgHover: "#F7F9F9",
  border: "#EFF3F4",
  borderStrong: "#CFD9DE",
  text: "#0F1419",
  textSub: "#536471",
  blue: "#1D9BF0",
  red: "#F4212E",
  redLight: "#FEF2F2",
  green: "#00BA7C",
  blueLight: "#E8F5FD",
  muted: "#F7F9F9",
  verified: "#1D9BF0",
};

// Moved utilities outside component to prevent unnecessary re-evaluations
const timeAgo = (dateStr: string) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return (
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) +
    " · " +
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  );
};

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
    } catch (e) {
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

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // FIX: Safely parse ID from Expo Router (could be string array depending on deep-link structure)
  const { id: rawId } = useLocalSearchParams();
  const postId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
  
  const { user } = useAuth();

  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ postId: string; username: string } | null>(null);

  const { data: post, isLoading: postLoading } = useGetPost(postId!);
  const { data: repliesData, refetch: refetchReplies } = useGetReplies(postId!);

  const { mutate: createPost, isPending: replyPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        setReplyText("");
        setReplyingTo(null);
        refetchReplies();
      },
    },
  });

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);

  const isLiked = localLiked !== null ? localLiked : post?.isLiked ?? false;
  const likesCount = localCount !== null ? localCount : post?.likesCount ?? 0;

  const handleLike = useCallback(() => {
    const newLiked = !isLiked;
    setLocalLiked(newLiked);
    setLocalCount(likesCount + (newLiked ? 1 : -1));
    if (newLiked) likePost({ postId: postId! });
    else unlikePost({ postId: postId! });
  }, [isLiked, likesCount, postId, likePost, unlikePost]);

  const handleReply = () => {
    if (!replyText.trim()) return;
    createPost({
      data: {
        content: replyText.trim(),
        parentPostId: replyingTo?.postId ?? postId!,
      } as any,
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const replies: Post[] = repliesData?.posts ?? [];

  if (postLoading) {
    return (
      <View style={[s.center, { backgroundColor: X.bg }]}>
        <ActivityIndicator size="large" color={X.blue} />
      </View>
    );
  }

  // FIX: Defined as a constant element instead of an inner function component.
  // This prevents the header from unmounting and flickering when typing.
  const headerComponent = (
    <View>
      {/* ── Nav bar ── */}
      <View style={[s.navBar, { paddingTop: topPadding + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} color={X.text} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Author row ── */}
      {post?.author && (
        <View style={s.authorRow}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.8}
          >
            <UserAvatar uri={post.author.avatarUrl} size={40} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={s.displayName} numberOfLines={1}>
                {post.author.displayName ?? post.author.username}
              </Text>
              {post.author.isVerified && (
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} color={X.verified} />
              )}
            </View>
            <Text style={s.username}>@{post.author.username}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.moreBtn} activeOpacity={0.7}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} strokeWidth={2} color={X.textSub} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Post content ── */}
      {post?.content && (
        <View style={s.contentBlock}>
          <Text style={s.postText}>{post.content}</Text>
        </View>
      )}

      {/* ── Image ── */}
      {post?.imageUrl && (
        <View style={s.imageWrapper}>
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: width - 28, height: (width - 28) * 0.56, borderRadius: 16 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* ── Timestamp ── */}
      {post?.createdAt && (
        <Text style={s.timestamp}>
          {formatDate(post.createdAt as unknown as string)}
        </Text>
      )}

      {/* ── Stats row ── */}
      {(likesCount > 0 || (post?.repliesCount ?? 0) > 0) && (
        <View style={s.statsRow}>
          {(post?.repliesCount ?? 0) > 0 && (
            <Text>
              <Text style={s.statNum}>{post?.repliesCount?.toLocaleString()}</Text>
              {" "}
              <Text style={s.statLabel}>Replies</Text>
            </Text>
          )}
          {likesCount > 0 && (
            <Text>
              <Text style={s.statNum}>{likesCount.toLocaleString()}</Text>
              {" "}
              <Text style={s.statLabel}>{likesCount === 1 ? "Like" : "Likes"}</Text>
            </Text>
          )}
        </View>
      )}

      {/* ── Action bar ── */}
      <View style={s.actionBar}>
        <TouchableOpacity
          style={s.actionBtn}
          activeOpacity={0.7}
          onPress={() =>
            setReplyingTo(
              replyingTo?.postId === postId
                ? null
                : { postId: postId!, username: post?.author?.username ?? "" }
            )
          }
        >
          <HugeiconsIcon icon={MessageCircle01Icon} size={20} strokeWidth={1.75} color={X.textSub} />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity onPress={handleLike} style={s.actionBtn} activeOpacity={0.7}>
          <HugeiconsIcon
            icon={Heart01Icon}
            size={20}
            strokeWidth={isLiked ? 0 : 1.75}
            color={isLiked ? X.red : X.textSub}
          />
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <HugeiconsIcon icon={Bookmark01Icon} size={20} strokeWidth={1.75} color={X.textSub} />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <HugeiconsIcon icon={Share01Icon} size={20} strokeWidth={1.75} color={X.textSub} />
        </TouchableOpacity>
      </View>

      {/* ── Replies section label ── */}
      <View style={s.repliesLabel}>
        <Text style={s.repliesLabelText}>Replies</Text>
      </View>

      {/* ── Replying-to banner ── */}
      {replyingTo && (
        <View style={s.replyingBanner}>
          <Text style={s.replyingBannerText}>
            Replying to{" "}
            <Text style={{ color: X.blue }}>@{replyingTo.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: X.blue }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // FIX: Wrapped in useCallback so typing doesn't re-render the whole list
  const renderReply = useCallback(
    ({ item }: { item: Post }) => (
      <ReplyItem
        reply={item}
        replyingTo={replyingTo}
        onReply={() =>
          setReplyingTo(
            replyingTo?.postId === item.id
              ? null
              : { postId: item.id, username: item.author.username }
          )
        }
        onAuthorPress={() => router.push(`/profile/${item.author.id}` as any)}
      />
    ),
    [replyingTo, router]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: X.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={renderReply}
        ListHeaderComponent={headerComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />

      {/* ── Reply composer ── */}
      <View
        style={[
          s.composer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 16 : 8) },
        ]}
      >
        <UserAvatar uri={user?.avatarUrl} size={36} />
        <TextInput
          style={s.composerInput}
          placeholder={
            replyingTo ? `Reply to @${replyingTo.username}…` : "Post your reply"
          }
          placeholderTextColor={X.textSub}
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity
          onPress={handleReply}
          disabled={!replyText.trim() || replyPending}
          style={[
            s.replyBtn,
            { backgroundColor: replyText.trim() ? X.blue : X.borderStrong },
          ]}
          activeOpacity={0.85}
        >
          <Text style={s.replyBtnText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Reply Item ───────────────────────────────────────────────────────────────
interface ReplyItemProps {
  reply: Post;
  replyingTo: { postId: string; username: string } | null;
  onReply: () => void;
  onAuthorPress: () => void;
}

function ReplyItem({ reply, replyingTo, onReply, onAuthorPress }: ReplyItemProps) {
  const isActive = replyingTo?.postId === reply.id;
  const [liked, setLiked] = useState(false);

  return (
    <View style={[s.replyRow, isActive && { backgroundColor: X.blueLight }]}>
      {/* Thread line + avatar */}
      <View style={{ alignItems: "center", width: 40 }}>
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8}>
          <UserAvatar uri={reply.author.avatarUrl} size={38} />
        </TouchableOpacity>
        <View style={s.threadLine} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: 12 }}>
        {/* Author */}
        <View style={s.replyMeta}>
          <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8}>
            <Text style={s.replyName} numberOfLines={1}>
              {reply.author.displayName ?? reply.author.username}
            </Text>
          </TouchableOpacity>
          <Text style={s.replyUsername}>@{reply.author.username}</Text>
          <Text style={s.replyDot}>·</Text>
          <Text style={s.replyTime}>
            {timeAgo(reply.createdAt as unknown as string)}
          </Text>
          <TouchableOpacity style={{ marginLeft: "auto" }} activeOpacity={0.7}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={2} color={X.textSub} />
          </TouchableOpacity>
        </View>

        {/* Text */}
        <Text style={s.replyText}>{reply.content}</Text>

        {/* Reply actions */}
        <View style={s.replyActions}>
          <TouchableOpacity onPress={onReply} style={s.replyAction} activeOpacity={0.7}>
            <HugeiconsIcon icon={MessageCircle01Icon} size={16} strokeWidth={1.75} color={X.textSub} />
            {(reply.repliesCount ?? 0) > 0 && (
              <Text style={s.replyActionCount}>{reply.repliesCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLiked((l) => !l)}
            style={s.replyAction}
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={Heart01Icon}
              size={16}
              strokeWidth={liked ? 0 : 1.75}
              color={liked ? X.red : X.textSub}
            />
            {(reply.likesCount ?? 0) > 0 && (
              <Text style={[s.replyActionCount, liked && { color: X.red }]}>
                {reply.likesCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.replyAction} activeOpacity={0.7}>
            <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1.75} color={X.textSub} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Nav
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: X.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: X.text,
    letterSpacing: -0.2,
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: X.text,
    letterSpacing: -0.1,
  },
  username: {
    fontSize: 14,
    color: X.textSub,
    marginTop: 1,
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },

  // Content
  contentBlock: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  postText: {
    fontSize: 20,
    lineHeight: 28,
    color: X.text,
    letterSpacing: -0.2,
  },
  imageWrapper: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  // Timestamp
  timestamp: {
    fontSize: 14,
    color: X.textSub,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  statNum: { fontSize: 14, fontWeight: "700", color: X.text },
  statLabel: { fontSize: 14, color: X.textSub },

  // Actions
  actionBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },

  // Replies label
  repliesLabel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  repliesLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: X.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Replying banner
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: X.blueLight,
  },
  replyingBannerText: { fontSize: 13, color: X.textSub },

  // Composer
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: X.border,
    backgroundColor: X.bg,
  },
  composerInput: {
    flex: 1,
    fontSize: 15,
    color: X.text,
    minHeight: 36,
    maxHeight: 100,
  },
  replyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  replyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Reply row
  replyRow: {
    flexDirection: "row",
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
    backgroundColor: X.bg,
    gap: 10,
  },
  threadLine: {
    width: 2,
    flex: 1,
    backgroundColor: X.border,
    marginTop: 6,
    borderRadius: 1,
    minHeight: 20,
  },
  replyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  replyName: {
    fontSize: 14,
    fontWeight: "700",
    color: X.text,
    maxWidth: 100,
  },
  replyUsername: {
    fontSize: 13,
    color: X.textSub,
  },
  replyDot: {
    fontSize: 13,
    color: X.textSub,
  },
  replyTime: {
    fontSize: 13,
    color: X.textSub,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
    color: X.text,
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  replyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  replyActionCount: {
    fontSize: 12,
    color: X.textSub,
  },
});