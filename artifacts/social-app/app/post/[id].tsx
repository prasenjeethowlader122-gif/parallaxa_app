import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetPost, useGetComments, useCreateComment, useLikePost, useUnlikePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft02Icon, HeartIcon, Message01Icon, Send02Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { PostCard } from "@/components/PostCard";

const { width } = Dimensions.get("window");

// ── RECURSIVE COMMENT COMPONENT ──
const CommentItem = ({ comment, depth = 0 }: { comment: any; depth?: number }) => {
  const colors = useColors();
  return (
    <View style={{ marginLeft: depth * 20, marginTop: 12 }}>
      <View className="flex-row items-start gap-2.5">
        <UserAvatar uri={comment.author?.avatarUrl} size={32} />
        <View className="flex-1">
          <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
            {comment.author?.username}
          </Text>
          <Text className="text-sm leading-[19px]" style={{ color: colors.foreground }}>
            {comment.content}
          </Text>
        </View>
      </View>
      {/* Recursive Render for Replies */}
      {comment.replies?.map((reply: any) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </View>
  );
};

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const { data: post, isLoading: postLoading } = useGetPost({ postId: id });
  const { data: commentsData } = useGetComments({ postId: id });
  const { mutate: createComment, isPending } = useCreateComment();

  // Helper to structure flat comments into a tree
  const buildTree = (comments: any[]) => {
    const map: any = {};
    const tree: any[] = [];
    comments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    comments.forEach(c => {
      if (c.parentId) map[c.parentId]?.replies.push(map[c.id]);
      else tree.push(map[c.id]);
    });
    return tree;
  };

  const commentTree = buildTree(commentsData?.comments ?? []);

  const PostHeader = () => (
    <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      {/* Navbar & Post UI remain similar but updated with Hugeicons */}
      <View className="flex-row items-center px-4 py-3" style={{ marginTop: insets.top }}>
        <TouchableOpacity onPress={() => router.back()}><HugeiconsIcon icon={ArrowLeft02Icon} size={24} color={colors.foreground} /></TouchableOpacity>
        <Text className="ml-4 text-[17px] font-bold" style={{ color: colors.foreground }}>Post</Text>
      </View>
      
      
      <PostCard {...post}/>
      {/* Author and Image sections... (use same structure as your provided code) */}
      
      <Text className="text-[13px] font-semibold p-4 uppercase text-mutedForeground">
        {commentsData?.comments?.length ?? 0} Comments
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <FlatList
        data={commentTree}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListHeaderComponent={<PostHeader />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Comment Input */}
      <View className="flex-row items-center px-3 pt-2 gap-2.5" style={{ borderTopWidth: 0.5, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }}>
        <UserAvatar uri={user?.avatarUrl} size={32} />
        <TextInput
          className="flex-1 text-[15px] p-2 outline-none"
          style={{ color: colors.foreground }}
          placeholder="Add a comment..."
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity onPress={() => createComment({ postId: id, data: { content: comment } })} disabled={!comment.trim()}>
          <Text className="font-bold" style={{ color: comment.trim() ? colors.primary : colors.mutedForeground }}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}