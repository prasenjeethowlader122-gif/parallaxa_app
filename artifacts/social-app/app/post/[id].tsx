import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  CheckCircleSolid,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetPost,
  useCreatePost,
  useLikePost, useUnlikePost,
} from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { useAuth as useAuthContext } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

// Custom hook to fetch replies since the generated client doesn't have useGetReplies
function useGetReplies(postId: string) {
  const [data, setData] = useState<{ posts: Post[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const refetch = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      // We need an auth token — read it from storage or context
      // For now we attempt the call; the authenticate middleware will handle it
      const token = (user as any)?._token ?? "";
      const res = await fetch(`${baseUrl}/api/posts/${postId}/replies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // silently fail — replies are non-critical
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ postId: string; username: string } | null>(null);

  const { data: post, isLoading: postLoading } = useGetPost(id!);
  const { data: repliesData, refetch: refetchReplies } = useGetReplies(id!);

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
    if (newLiked) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id]);

  const handleReply = () => {
    if (!replyText.trim()) return;
    const targetPostId = replyingTo?.postId ?? id!;
    createPost({
      data: {
        content: replyText.trim(),
        parentPostId: targetPostId,
      } as any, // parentPostId is a valid server field, schema type extended
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const replies: Post[] = repliesData?.posts ?? [];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (postLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const PostHeader = () => (
    <View>
      {/* Nav */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <HugeiconsIcon icon={ArrowLeft} width={24} height={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Author */}
      {post?.author && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}
          onPress={() => router.push(`/profile/${post.author.id}` as any)}
          activeOpacity={0.8}
        >
          <UserAvatar uri={post.author.avatarUrl} size={36} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {post.author.username}
          </Text>
          {post.author.isVerified && (
            <HugeiconsIcon icon={CheckCircleSolid} width={14} height={14} color={colors.primary} />
          )}
        </TouchableOpacity>
      )}

      {/* Post content */}
      {post?.content && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.foreground }}>
            {post.content}
          </Text>
        </View>
      )}

      {/* Image */}
      {post?.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width, height: width, resizeMode: "cover", backgroundColor: "#F0F0F0" }}
        />
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={handleLike} style={{ padding: 4, marginRight: 8 }}>
          <HugeiconsIcon
            icon={Heart}
            width={24}
            height={24}
            color={isLiked ? colors.destructive : colors.foreground}
          />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 4, marginRight: 8 }}>
          <HugeiconsIcon icon={MessageCircle} width={24} height={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 4 }}>
          <HugeiconsIcon icon={Send} width={22} height={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: "700", paddingHorizontal: 14, paddingVertical: 6, fontSize: 14, color: colors.foreground }}>
        {likesCount.toLocaleString()} likes
      </Text>

      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          paddingHorizontal: 14,
          paddingVertical: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: colors.mutedForeground,
        }}
      >
        {replies.length} Replies
      </Text>

      {/* Replying-to banner */}
      {replyingTo && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: colors.muted,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            Replying to{" "}
            <Text style={{ fontWeight: "600", color: colors.foreground }}>
              @{replyingTo.username}
            </Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReply = ({ item }: { item: Post }) => (
    <ReplyItem
      reply={item}
      colors={colors}
      timeAgo={timeAgo}
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
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={renderReply}
        ListHeaderComponent={<PostHeader />}
        showsVerticalScrollIndicator={false}
      />

      {/* Reply input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: 8,
          gap: 10,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
        }}
      >
        <UserAvatar uri={user?.avatarUrl} size={32} />
        <TextInput
          style={{ flex: 1, fontSize: 15, color: colors.foreground }}
          placeholder={
            replyingTo
              ? `Reply to @${replyingTo.username}...`
              : "Add a reply..."
          }
          placeholderTextColor={colors.mutedForeground}
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity
          onPress={handleReply}
          disabled={!replyText.trim() || replyPending}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: replyText.trim() ? colors.primary : colors.mutedForeground,
            }}
          >
            {replyingTo ? "Reply" : "Post"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

interface ReplyItemProps {
  reply: Post;
  colors: any;
  timeAgo: (date: string) => string;
  replyingTo: { postId: string; username: string } | null;
  onReply: () => void;
  onAuthorPress: () => void;
}

function ReplyItem({ reply, colors, timeAgo, replyingTo, onReply, onAuthorPress }: ReplyItemProps) {
  const isBeingRepliedTo = replyingTo?.postId === reply.id;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        backgroundColor: isBeingRepliedTo ? colors.muted : colors.background,
      }}
    >
      <TouchableOpacity onPress={onAuthorPress}>
        <UserAvatar uri={reply.author.avatarUrl} size={32} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, lineHeight: 19, color: colors.foreground }}>
          <Text style={{ fontWeight: "600" }}>{reply.author.username} </Text>
          {reply.content}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 4, alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {timeAgo(reply.createdAt as unknown as string)}
          </Text>
          <TouchableOpacity onPress={onReply}>
            <Text style={{ fontSize: 11, fontWeight: "500", color: colors.primary }}>
              {isBeingRepliedTo ? "Cancel" : "Reply"}
            </Text>
          </TouchableOpacity>
          {(reply.repliesCount ?? 0) > 0 && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {reply.repliesCount} {reply.repliesCount === 1 ? "reply" : "replies"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}