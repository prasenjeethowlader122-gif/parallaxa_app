import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  CheckCircleSolid,
  User,
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
  useLikePost, useUnlikePost, useCreateReply,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

const { width } = Dimensions.get("window");

// Types (unchanged)
interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  replies?: Comment[];
  replyCount: number;
}

interface Post {
  id: string;
  content?: string;
  imageUrl?: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  author: User;
}

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: post, isLoading: postLoading } = useGetPost({ postId: id! });
  const { data: commentsData, refetch: refetchComments } = useGetComments({ postId: id! });
  const { mutate: createComment, isPending: commentPending } = useCreateComment({
    mutation: { onSuccess: () => { setComment(""); refetchComments(); } },
  });
  const { mutate: createReply, isPending: replyPending } = useCreateReply({
    mutation: { onSuccess: () => { setComment(""); setReplyingTo(null); refetchComments(); } },
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

  const handleComment = () => {
    if (!comment.trim()) return;
    if (replyingTo) {
      createReply({ 
        commentId: replyingTo, 
        data: { content: comment.trim() } 
      });
    } else {
      createComment({ postId: id!, data: { content: comment.trim() } });
    }
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const comments: Comment[] = commentsData?.comments ?? [];

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

  const renderComment = ({ item: comment }: { item: Comment }) => (
    <CommentItem 
      comment={comment}
      colors={colors}
      timeAgo={timeAgo}
      replyingTo={replyingTo}
      setReplyingTo={setReplyingTo}
      user={user}
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
        {comments.length} Comments
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={comments}
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
          placeholder={replyingTo ? "Reply..." : "Add a comment..."}
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity 
          onPress={handleComment} 
          disabled={!comment.trim() || (commentPending || replyPending)}
        >
          <Text
            className="text-[15px] font-bold"
            style={{ 
              color: comment.trim() ? colors.primary : colors.mutedForeground 
            }}
          >
            {replyingTo ? "Reply" : "Post"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// CommentItem component (no icon changes needed here)
interface CommentItemProps {
  comment: Comment;
  colors: any;
  timeAgo: (date: string) => string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  user?: User;
}

const CommentItem = ({ 
  comment, 
  colors, 
  timeAgo, 
  replyingTo, 
  setReplyingTo,
  user 
}: CommentItemProps) => {
  const renderReplies = (replies: Comment[]) => (
    <View className="ml-8 border-l-2 border-l-gray-200 pl-4">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          colors={colors}
          timeAgo={timeAgo}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          user={user}
        />
      ))}
    </View>
  );

  return (
    <View className="mb-2">
      <View className="flex-row items-start gap-2.5 px-3.5 py-2.5" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <UserAvatar uri={comment.author.avatarUrl} size={32} />
        <View className="flex-1">
          <Text className="text-sm leading-[19px]" style={{ color: colors.foreground }}>
            <Text className="font-semibold">{comment.author.username} </Text>
            {comment.content}
          </Text>
          <View className="flex-row gap-2 mt-1">
            <Text className="text-[11px]" style={{ color: colors.mutedForeground }}>
              {timeAgo(comment.createdAt)}
            </Text>
            {comment.replyCount > 0 && (
              <TouchableOpacity onPress={() => setReplyingTo(comment.id)}>
                <Text style={{ color: colors.primary }} className="text-[11px]">Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && renderReplies(comment.replies)}
    </View>
  );
};
