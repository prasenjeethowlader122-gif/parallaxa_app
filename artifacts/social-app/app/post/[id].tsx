import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
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
    mutation: {
      onSuccess: () => { setComment(""); refetchComments(); },
    },
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const author = (post as any)?.author;

  const PostHeader = () => (
    <View>
      {/* Nav */}
      <View style={[styles.navbar, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Author */}
      {author && (
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => router.push(`/profile/${author.id}` as any)}
          activeOpacity={0.8}
        >
          <UserAvatar uri={author.avatarUrl} size={36} />
          <Text style={[styles.authorName, { color: colors.foreground }]}>{author.username}</Text>
          {author.isVerified && <Feather name="check-circle" size={14} color={colors.primary} />}
        </TouchableOpacity>
      )}

      {/* Image */}
      {(post as any)?.imageUrl && (
        <Image source={{ uri: (post as any).imageUrl }} style={[styles.image, { width }]} />
      )}

      {/* Actions */}
      <View style={[styles.actionsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Feather name="heart" size={24} color={isLiked ? colors.destructive : colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="message-circle" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="send" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.likesText, { color: colors.foreground }]}>
        {likesCount.toLocaleString()} likes
      </Text>

      {(post as any)?.content && (
        <View style={styles.captionRow}>
          <Text style={[styles.caption, { color: colors.foreground }]}>
            <Text style={styles.captionUsername}>{author?.username} </Text>
            {(post as any).content}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>Comments</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={comments}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
            <UserAvatar uri={item.author?.avatarUrl} size={32} />
            <View style={styles.commentContent}>
              <Text style={[styles.commentText, { color: colors.foreground }]}>
                <Text style={styles.commentUsername}>{item.author?.username} </Text>
                {item.content}
              </Text>
              <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        )}
        ListHeaderComponent={<PostHeader />}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment input */}
      <View style={[styles.commentInputContainer, {
        borderTopColor: colors.border,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
      }]}>
        <UserAvatar uri={user?.avatarUrl} size={32} />
        <TextInput
          style={[styles.commentInput, { color: colors.foreground }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity onPress={handleComment} disabled={!comment.trim() || isPending}>
          <Text style={[styles.postBtn, { color: comment.trim() ? colors.primary : colors.mutedForeground }]}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  navbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: "700" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  authorName: { fontSize: 14, fontWeight: "600" },
  image: { height: width, resizeMode: "cover", backgroundColor: "#F0F0F0" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  actionBtn: { padding: 4, marginRight: 8 },
  likesText: { fontWeight: "700", paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 },
  captionRow: { paddingHorizontal: 14, paddingBottom: 8 },
  caption: { fontSize: 14, lineHeight: 20 },
  captionUsername: { fontWeight: "700" },
  sectionHeader: { fontSize: 13, fontWeight: "600", padding: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentContent: { flex: 1 },
  commentText: { fontSize: 14, lineHeight: 19 },
  commentUsername: { fontWeight: "600" },
  commentTime: { fontSize: 11, marginTop: 3 },
  commentInputContainer: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingTop: 8, gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentInput: { flex: 1, fontSize: 15 },
  postBtn: { fontSize: 15, fontWeight: "700" },
});
