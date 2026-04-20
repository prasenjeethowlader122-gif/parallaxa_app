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
  StyleSheet,
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
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
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

  const replies: Post[] = repliesData?.posts ?? [];
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (postLoading) {
    return (
      <View style={[s.flex1, s.center, { backgroundColor: X.bg }]}>
        <ActivityIndicator size="large" color={X.blue} />
      </View>
    );
  }

  // ── List Header ────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Nav */}
      <View style={[s.navBar, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.iconBtn}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            strokeWidth={2.2}
            color={X.text}
          />
        </TouchableOpacity>
        <Text style={s.navTitle}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Author row */}
      {post?.author && (
        <View style={s.authorRow}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${post.author.id}` as any)}
            activeOpacity={0.85}
          >
            <UserAvatar uri={post.author.avatarUrl} size={44} />
          </TouchableOpacity>

          <View style={s.authorInfo}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/${post.author.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={s.row}>
                <Text style={s.displayName} numberOfLines={1}>
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
              <Text style={s.usernameText}>@{post.author.username}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.iconBtn} activeOpacity={0.7} hitSlop={8}>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={18}
              strokeWidth={2}
              color={X.textSub}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Post content */}
      {post?.content ? (
        <Text style={s.postContent}>{post.content}</Text>
      ) : null}

      {/* Post image */}
      {post?.imageUrl ? (
        <View style={s.imageWrap}>
          <Image
            source={{ uri: post.imageUrl }}
            style={{
              width: width - 32,
              height: (width - 32) * 0.5625,
              borderRadius: 14,
            }}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Timestamp */}
      {post?.createdAt ? (
        <Text style={s.timestamp}>
          {formatFullDate(post.createdAt as unknown as string)}
        </Text>
      ) : null}

      {/* Stats row */}
      {(likesCount > 0 ||
        (post?.repliesCount ?? 0) > 0 ||
        (post?.commentsCount ?? 0) > 0) ? (
        <View style={s.statsRow}>
          {((post?.repliesCount ?? 0) > 0 || (post?.commentsCount ?? 0) > 0) ? (
            <View style={s.statItem}>
              <Text style={s.statNum}>
                {fmtCount(post?.repliesCount ?? post?.commentsCount ?? 0)}
              </Text>
              <Text style={s.statLabel}> Replies</Text>
            </View>
          ) : null}
          {likesCount > 0 ? (
            <View style={s.statItem}>
              <Text style={s.statNum}>{fmtCount(likesCount)}</Text>
              <Text style={s.statLabel}>
                {likesCount === 1 ? " Like" : " Likes"}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Action bar */}
      <View style={s.actionBar}>
        {/* Reply */}
        <ActionBtn
          icon={MessageCircle01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={replyTarget?.postId === id}
          onPress={() =>
            openReply(id!, post?.author?.username ?? "")
          }
        />
        {/* Repost */}
        <ActionBtn
          icon={ArrowUp01Icon}
          color={X.textSub}
          activeColor={X.green}
          active={false}
          onPress={() => {}}
        />
        {/* Like */}
        <ActionBtn
          icon={Heart01Icon}
          color={X.textSub}
          activeColor={X.red}
          active={isLiked}
          onPress={handleLike}
        />
        {/* Bookmark */}
        <ActionBtn
          icon={Bookmark01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={isSaved}
          onPress={() => setIsSaved((v) => !v)}
        />
        {/* Share */}
        <ActionBtn
          icon={Share01Icon}
          color={X.textSub}
          activeColor={X.blue}
          active={false}
          onPress={() => {}}
        />
      </View>

      {/* Replies header */}
      <View style={s.sectionHead}>
        <Text style={s.sectionHeadText}>Replies</Text>
      </View>

      {/* Replying-to banner */}
      {replyTarget ? (
        <View style={s.replyBanner}>
          <Text style={s.replyBannerText}>
            Replying to{" "}
            <Text style={{ color: X.blue }}>@{replyTarget.username}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setReplyTarget(null)}
            hitSlop={8}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  // ── Render reply item ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Post }) => (
    <ReplyItem
      reply={item}
      isTargeted={replyTarget?.postId === item.id}
      onReply={() => openReply(item.id, item.author.username)}
      onAuthorPress={() =>
        router.push(`/profile/${item.author.id}` as any)
      }
    />
  );

  return (
    <KeyboardAvoidingView
      style={[s.flex1, { backgroundColor: X.bg }]}
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
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>No replies yet</Text>
            <Text style={s.emptySub}>Be the first to reply to this post</Text>
          </View>
        }
      />

      {/* Reply composer */}
      <View
        style={[
          s.composer,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 16 : 8),
          },
        ]}
      >
        <UserAvatar uri={user?.avatarUrl} size={36} />
        <TextInput
          ref={inputRef}
          style={s.composerInput}
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
          style={[
            s.sendBtn,
            {
              backgroundColor: replyText.trim() ? X.blue : X.borderStrong,
            },
          ]}
        >
          {replyPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.sendBtnText}>Reply</Text>
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
      style={s.actionBtn}
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

// ── Reply Item ───────────────────────────────────────────────────────────────
interface ReplyItemProps {
  reply: Post;
  isTargeted: boolean;
  onReply: () => void;
  onAuthorPress: () => void;
}

function ReplyItem({ reply, isTargeted, onReply, onAuthorPress }: ReplyItemProps) {
  const [liked, setLiked] = useState(reply.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(reply.likesCount ?? 0);

  const handleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
  }, [liked]);

  return (
    <View
      style={[
        s.replyCard,
        isTargeted && { backgroundColor: X.blueLight },
      ]}
    >
      {/* Left: avatar + thread line */}
      <View style={s.replyLeft}>
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.85}>
          <UserAvatar uri={reply.author?.avatarUrl} size={38} />
        </TouchableOpacity>
        <View style={s.threadLine} />
      </View>

      {/* Right: content */}
      <View style={s.replyRight}>
        {/* Meta */}
        <View style={s.replyMeta}>
          <TouchableOpacity
            onPress={onAuthorPress}
            activeOpacity={0.85}
            style={{ flexShrink: 1 }}
          >
            <View style={[s.row, { gap: 3 }]}>
              <Text style={s.replyName} numberOfLines={1}>
                {reply.author?.displayName ?? reply.author?.username}
              </Text>
              {reply.author?.isVerified ? (
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={13}
                  color={X.verified}
                />
              ) : null}
            </View>
          </TouchableOpacity>
          <Text style={s.replyHandle} numberOfLines={1}>
            {"  "}@{reply.author?.username}
          </Text>
          <Text style={s.replyDot}>·</Text>
          <Text style={s.replyTime}>
            {timeAgo(reply.createdAt as unknown as string)}
          </Text>
          <TouchableOpacity
            style={{ marginLeft: "auto" }}
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
          <Text style={s.replyContent}>{reply.content}</Text>
        ) : null}

        {/* Reply image */}
        {reply.imageUrl ? (
          <Image
            source={{ uri: reply.imageUrl }}
            style={s.replyImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Reply actions */}
        <View style={s.replyActions}>
          {/* Reply */}
          <TouchableOpacity
            onPress={onReply}
            style={s.replyAction}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={MessageCircle01Icon}
              size={16}
              strokeWidth={1.75}
              color={isTargeted ? X.blue : X.textSub}
            />
            {(reply.repliesCount ?? 0) > 0 ? (
              <Text
                style={[
                  s.replyActionCount,
                  isTargeted && { color: X.blue },
                ]}
              >
                {fmtCount(reply.repliesCount ?? 0)}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            onPress={handleLike}
            style={s.replyAction}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={Heart01Icon}
              size={16}
              strokeWidth={liked ? 0 : 1.75}
              color={liked ? X.red : X.textSub}
            />
            {likeCount > 0 ? (
              <Text
                style={[
                  s.replyActionCount,
                  liked && { color: X.red },
                ]}
              >
                {fmtCount(likeCount)}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={s.replyAction}
            activeOpacity={0.7}
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

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex1: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center" },

  // Nav
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: X.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: X.text,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  authorInfo: { flex: 1 },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: X.text,
    letterSpacing: -0.2,
    marginRight: 2,
  },
  usernameText: {
    fontSize: 14,
    color: X.textSub,
    marginTop: 2,
  },

  // Content
  postContent: {
    fontSize: 20,
    lineHeight: 28,
    color: X.text,
    letterSpacing: -0.2,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  imageWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Timestamp
  timestamp: {
    fontSize: 14,
    color: X.textSub,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: X.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  statItem: { flexDirection: "row", alignItems: "baseline" },
  statNum: { fontSize: 14, fontWeight: "700", color: X.text },
  statLabel: { fontSize: 14, color: X.textSub },

  // Action bar
  actionBar: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },

  // Section header
  sectionHead: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
    backgroundColor: X.bgSecondary,
  },
  sectionHeadText: {
    fontSize: 12,
    fontWeight: "700",
    color: X.textSub,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // Reply banner
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: X.blueLight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
  },
  replyBannerText: { fontSize: 13, color: X.textSub },
  cancelText: { fontSize: 13, fontWeight: "600", color: X.blue },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: X.text,
    marginBottom: 6,
  },
  emptySub: { fontSize: 14, color: X.textSub, textAlign: "center" },

  // Composer
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
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
    minHeight: 38,
    maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 8 : 4,
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 68,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Reply card
  replyCard: {
    flexDirection: "row",
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: X.border,
    backgroundColor: X.bg,
    gap: 10,
  },
  replyLeft: {
    alignItems: "center",
    width: 40,
  },
  threadLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    minHeight: 20,
    backgroundColor: X.border,
    borderRadius: 1,
  },
  replyRight: {
    flex: 1,
    paddingBottom: 12,
  },
  replyMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    flexWrap: "nowrap",
  },
  replyName: {
    fontSize: 14,
    fontWeight: "700",
    color: X.text,
    maxWidth: 110,
  },
  replyHandle: {
    fontSize: 13,
    color: X.textSub,
    flexShrink: 1,
  },
  replyDot: { fontSize: 13, color: X.textSub, marginHorizontal: 3 },
  replyTime: { fontSize: 13, color: X.textSub },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
    color: X.text,
    marginBottom: 8,
  },
  replyImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
    paddingTop: 2,
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