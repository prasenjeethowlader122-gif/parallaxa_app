import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

  const StoriesHeader = () => (
    <View>
      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: topPadding, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.foreground }]}>Pulse</Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => router.push("/messages" as any)} style={styles.navBtn}>
            <Feather name="send" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      {storiesData && storiesData.length > 0 && (
        <View style={[styles.storiesContainer, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
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

  const posts = feedData?.posts ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <View style={styles.loadingContainer}>
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
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  navActions: { flexDirection: "row", gap: 4 },
  navBtn: { padding: 6 },
  storiesContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  storiesContent: { paddingHorizontal: 8 },
  loadingContainer: { padding: 40, alignItems: "center" },
  emptyContainer: { flexGrow: 1 },
});
