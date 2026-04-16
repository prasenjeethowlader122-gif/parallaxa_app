import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const { data: post, isLoading: postLoading } = useGetPost({ postId: id });
  const { data: commentsData, refetch: refetchComments } = useGetComments({ postId: id });
  const { mutate: createComment, isPending } = useCreateComment({
    mutation: { onSuccess: () => { setComment(""); refetchComments(); } },
  });
  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);

  const isLiked = localLiked !== null ? localLiked : (post as any)?.isLiked ?? false;
  const likesCount = localCount !== null ? localCount : (post as any)?.likesCount ?? 0;

  const handleLike = () => {
    const newLiked = !isLiked;
    setLocalLiked(newLiked);
    setLocalCount(likesCount + (newLiked ? 1 : -1));
    if (newLiked) likePost({ postId: id });
    else unlikePost({ postId: id });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    createComment({ postId: id, data: { content: comment.trim() } });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const comments = commentsData?.comments ?? [];

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

  const author = (post as any)?.author;

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
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Author */}
      {author && (
        <TouchableOpacity
          className="flex-row items-center gap-2.5 p-3"
          onPress={() => router.push(`/profile/${author.id}` as any)}
          activeOpacity={0.8}
        >
          <UserAvatar uri={author.avatarUrl} size={36} />
          <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>{author.username}</Text>
          {author.isVerified && <Feather name="check-circle" size={14} color={colors.primary} />}
        </TouchableOpacity>
      )}

      {/* Image */}
      {(post as any)?.imageUrl && (
        <Image
          source={{ uri: (post as any).imageUrl }}
          style={{ width, height: width, resizeMode: "cover", backgroundColor: "#F0F0F0" }}
        />
      )}

      {/* Actions */}
      <View
        className="flex-row items-center px-3 py-2.5 gap-2"
        style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={handleLike} className="p-1 mr-2">
          <Feather name="heart" size={24} color={isLiked ? colors.destructive : colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity className="p-1 mr-2">
          <Feather name="message-circle" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity className="p-1">
          <Feather name="send" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text className="font-bold px-3.5 py-1.5 text-sm" style={{ color: colors.foreground }}>
        {likesCount.toLocaleString()} likes
      </Text>

      {(post as any)?.content && (
        <View className="px-3.5 pb-2">
          <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
            <Text className="font-bold">{author?.username} </Text>
            {(post as any).content}
          </Text>
        </View>
      )}

      <Text
        className="text-[13px] font-semibold p-3.5 uppercase tracking-wide"
        style={{ color: colors.mutedForeground }}
      >
        Comments
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
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View
            className="flex-row items-start gap-2.5 px-3.5 py-2.5"
            style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
          >
            <UserAvatar uri={item.author?.avatarUrl} size={32} />
            <View className="flex-1">
              <Text className="text-sm leading-[19px]" style={{ color: colors.foreground }}>
                <Text className="font-semibold">{item.author?.username} </Text>
                {item.content}
              </Text>
              <Text className="text-[11px] mt-0.5" style={{ color: colors.mutedForeground }}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
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
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity onPress={handleComment} disabled={!comment.trim() || isPending}>
          <Text
            className="text-[15px] font-bold"
            style={{ color: comment.trim() ? colors.primary : colors.mutedForeground }}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
