import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  CheckCircleSolid,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetPost, useGetComments, useCreateComment,
  useLikePost, useUnlikePost,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

const { width } = Dimensions.get("window");

// Types aligned with api.schemas.ts
interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isFollowing: boolean;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: UserSummary;
  parentId?: string | null;
  repliesCount: number; // fixed: was replyCount
}

interface Post {
  id: string;
  content?: string | null;
  imageUrl?: string | null;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  author: UserSummary;
}

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);

  // Fixed: positional args instead of object params
  const { data: post, isLoading: postLoading } = useGetPost(id!);
  const { data: commentsData, refetch: refetchComments } = useGetComments(id!);

  // Replies use createComment with parentId per the API schema
  const { mutate: createComment, isPending: commentPending } = useCreateComment({
    mutation: {
      onSuccess: () => {
        setComment("");
        setReplyingTo(null);
        refetchComments();
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
    // Fixed: positional args
    if (newLiked) likePost({ postId: id! });
    else unlikePost({ postId: id! });
  }, [isLiked, likesCount, id]);

  const handleComment = () => {
    if (!comment.trim()) return;
    // Fixed: use createComment with optional parentId for replies
    createComment({
      postId: id!,
      data: {
        content: comment.trim(),
        ...(replyingTo ? { parentId: replyingTo.commentId } : {}),
      },
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  // Fixed: CommentPage has comments array per schema
  const comments: Comment[] = (commentsData?.comments ?? []) as Comment[];

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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Only show top-level comments (no parentId)
  const topLevelComments = comments.filter((c) => !c.parentId);

  const renderComment = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      colors={colors}
      timeAgo={timeAgo}
      replyingTo={replyingTo}
      setReplyingTo={setReplyingTo}
    />
  );

  const PostHeader = () => (
    <View>
      {/* Nav */}
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <HugeiconsIcon icon={ArrowLeft} width={24} height={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Author */}
      {post?.author && (
        <TouchableOpacity
          className="flex-row items-center gap-2.5 p-3"
          onPress={() => router.push(`/profile/${post.author.id}`)}
          activeOpacity={0.8}
        >
          <UserAvatar uri={post.author.avatarUrl} size={36} />
          <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
            {post.author.username}
          </Text>
          {post.author.isVerified && (
            <HugeiconsIcon icon={CheckCircleSolid} width={14} height={14} color={colors.primary} />
          )}
        </TouchableOpacity>
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
        className="flex-row items-center px-3 py-2.5 gap-2"
        style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={handleLike} className="p-1 mr-2">
          <HugeiconsIcon
            icon={Heart}
            width={24}
            height={24}
            color={isLiked ? colors.destructive : colors.foreground}
          />
        </TouchableOpacity>
        <TouchableOpacity className="p-1 mr-2">
          <HugeiconsIcon icon={MessageCircle} width={24} height={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity className="p-1">
          <HugeiconsIcon icon={Send} width={22} height={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text className="font-bold px-3.5 py-1.5 text-sm" style={{ color: colors.foreground }}>
        {likesCount.toLocaleString()} likes
      </Text>

      {post?.content && (
        <View className="px-3.5 pb-2">
          <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
            <Text className="font-bold">{post.author?.username} </Text>
            {post.content}
          </Text>
        </View>
      )}

      <Text
        className="text-[13px] font-semibold p-3.5 uppercase tracking-wide"
        style={{ color: colors.mutedForeground }}
      >
        {topLevelComments.length} Comments
      </Text>

      {/* Show replying-to banner */}
      {replyingTo && (
        <View
          className="flex-row items-center justify-between px-3.5 py-2"
          style={{ backgroundColor: colors.muted }}
        >
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Replying to{" "}
            <Text className="font-semibold" style={{ color: colors.foreground }}>
              @{replyingTo.username}
            </Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={topLevelComments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={<PostHeader />}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment input */}
      <View
        className="flex-row items-center px-3 pt-2 gap-2.5"
        style={{
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
        }}
      >
        <UserAvatar uri={user?.avatarUrl} size={32} />
        <TextInput
          className="flex-1 text-[15px]"
          style={{ color: colors.foreground }}
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity
          onPress={handleComment}
          disabled={!comment.trim() || commentPending}
        >
          <Text
            className="text-[15px] font-bold"
            style={{
              color: comment.trim() ? colors.primary : colors.mutedForeground,
            }}
          >
            {replyingTo ? "Reply" : "Post"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// CommentItem component
interface CommentItemProps {
  comment: Comment;
  colors: any;
  timeAgo: (date: string) => string;
  replyingTo: { commentId: string; username: string } | null;
  setReplyingTo: (val: { commentId: string; username: string } | null) => void;
}

const CommentItem = ({
  comment,
  colors,
  timeAgo,
  replyingTo,
  setReplyingTo,
}: CommentItemProps) => {
  const isBeingRepliedTo = replyingTo?.commentId === comment.id;

  return (
    <View className="mb-2">
      <View
        className="flex-row items-start gap-2.5 px-3.5 py-2.5"
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          // Highlight the comment being replied to
          backgroundColor: isBeingRepliedTo ? colors.muted : colors.background,
        }}
      >
        <UserAvatar uri={comment.author.avatarUrl} size={32} />
        <View className="flex-1">
          <Text className="text-sm leading-[19px]" style={{ color: colors.foreground }}>
            <Text className="font-semibold">{comment.author.username} </Text>
            {comment.content}
          </Text>
          <View className="flex-row gap-3 mt-1 items-center">
            <Text className="text-[11px]" style={{ color: colors.mutedForeground }}>
              {timeAgo(comment.createdAt)}
            </Text>
            {/* Fixed: was checking replyCount > 0, now correctly shows reply button always for top-level */}
            {!comment.parentId && (
              <TouchableOpacity
                onPress={() =>
                  setReplyingTo(
                    isBeingRepliedTo
                      ? null
                      : { commentId: comment.id, username: comment.author.username }
                  )
                }
              >
                <Text style={{ color: colors.primary }} className="text-[11px] font-medium">
                  {isBeingRepliedTo ? "Cancel" : "Reply"}
                </Text>
              </TouchableOpacity>
            )}
            {/* Fixed: was replyCount, now repliesCount per schema */}
            {comment.repliesCount > 0 && (
              <Text className="text-[11px]" style={{ color: colors.mutedForeground }}>
                {comment.repliesCount} {comment.repliesCount === 1 ? "reply" : "replies"}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};