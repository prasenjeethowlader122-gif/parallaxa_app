import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetFeed, useGetStories, useLikePost, useUnlikePost, useSavePost, useUnsavePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { PostCard } from "@/components/PostCard";
import { StoryCircle } from "@/components/StoryCircle";
import { EmptyState } from "@/components/EmptyState";

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetFeed();
  const { data: storiesData, refetch: refetchStories } = useGetStories();
  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: unsavePost } = useUnsavePost();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeed(), refetchStories()]);
    setRefreshing(false);
  }, [refetchFeed, refetchStories]);

  const handleLike = (postId: string, liked: boolean) => {
    if (liked) likePost({ postId });
    else unlikePost({ postId });
  };

  const handleSave = (postId: string, saved: boolean) => {
    if (saved) savePost({ postId });
    else unsavePost({ postId });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const posts = feedData?.posts ?? [];

  const StoriesHeader = () => (
    <View>
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <Text className="text-[26px] font-bold -tracking-tight" style={{ color: colors.foreground }}>
          Pulse
        </Text>
        <View className="flex-row gap-1">
          <TouchableOpacity onPress={() => router.push("/messages" as any)} className="p-1.5">
            <Feather name="send" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {storiesData && storiesData.length > 0 && (
        <View className="py-2.5" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            <StoryCircle
              userId={user?.id ?? ""}
              username="Your story"
              avatarUrl={user?.avatarUrl}
              hasUnviewed={false}
              isOwn
              onPress={() => router.push("/(tabs)/create" as any)}
            />
            {storiesData.map((group: any) => (
              <StoryCircle
                key={group.user.id}
                userId={group.user.id}
                username={group.user.username}
                avatarUrl={group.user.avatarUrl}
                hasUnviewed={group.hasUnviewed}
                onPress={() => router.push(`/story/${group.user.id}` as any)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <PostCard
            id={item.id}
            author={item.author}
            content={item.content}
            imageUrl={item.imageUrl}
            location={item.location}
            hashtags={item.hashtags}
            likesCount={item.likesCount}
            commentsCount={item.commentsCount}
            isLiked={item.isLiked}
            isSaved={item.isSaved}
            createdAt={item.createdAt}
            onLike={handleLike}
            onSave={handleSave}
          />
        )}
        ListHeaderComponent={<StoriesHeader />}
        ListEmptyComponent={
          feedLoading ? (
            <View className="p-10 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon="image"
              title="No posts yet"
              subtitle="Follow people to see their posts here"
              actionLabel="Explore"
              onAction={() => router.push("/(tabs)/explore" as any)}
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </View>
  );
}
