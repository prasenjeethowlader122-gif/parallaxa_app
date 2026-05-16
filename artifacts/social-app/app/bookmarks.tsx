import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/Text";
import { useGetSavedPosts } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { BookmarkIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

export default function BookmarksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const [refreshing, setRefreshing] = React.useState(false);
  const { data, isLoading, refetch } = useGetSavedPosts();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const posts: any[] = data?.posts ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: topPadding,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            strokeWidth={2}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.foreground,
              letterSpacing: -0.3,
            }}
          >
            Bookmarks
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 1 }}>
            @your saved posts
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <PostCard
              id={item.id}
              author={item.author}
              content={item.content}
              imageUrl={item.imageUrl}
              hashtags={item.hashtags}
              likesCount={item.likesCount ?? 0}
              commentsCount={item.commentsCount ?? 0}
              isLiked={item.isLiked ?? false}
              isSaved={item.isSaved ?? true}
              createdAt={item.createdAt}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={BookmarkIcon}
              title="No bookmarks yet"
              subtitle="Save posts to read them later — they'll appear here."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            posts.length === 0 ? { flexGrow: 1 } : { paddingBottom: insets.bottom + 20 }
          }
        />
      )}
    </View>
  );
}
