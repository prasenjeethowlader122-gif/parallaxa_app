import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetFeed,
  useGetExplorePosts,
} from "@workspace/api-client-react";
import { Image01Icon, Fire01Icon, UserGroup01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

type TabId = "foryou" | "following" | "trending";

const TABS: { id: TabId; label: string }[] = [
  { id: "foryou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("foryou");

  // "For You" ও "Trending" — explore endpoint
  const {
    data: exploreData,
    isLoading: exploreLoading,
    refetch: refetchExplore,
  } = useGetExplorePosts();

  // "Following" — feed endpoint (followed users' posts)
  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useGetFeed();

  // active tab অনুযায়ী posts ও loading state বাছাই
  const isFollowingTab = activeTab === "following";
  const posts = isFollowingTab
    ? (feedData?.posts ?? [])
    : (exploreData?.posts ?? []);
  const isLoading = isFollowingTab ? feedLoading : exploreLoading;
  const refetch = isFollowingTab ? refetchFeed : refetchExplore;

  // Trending ট্যাবে likesCount অনুযায়ী sort করো
  const displayPosts =
    activeTab === "trending"
      ? [...posts].sort((a: any, b: any) => (b.likesCount ?? 0) - (a.likesCount ?? 0))
      : posts;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── ট্যাব বার ── */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.foreground,
                  opacity: isActive ? 1 : 0.4,
                }}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 16,
                    right: 16,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: colors.foreground,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── ফিড লিস্ট ── */}
      <FlatList
        key={activeTab} // tab বদলালে list পুরো remount হবে
        data={displayPosts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <PostCard {...item} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : activeTab === "following" ? (
            <EmptyState
              icon={UserGroup01Icon}
              title="No posts from following"
              subtitle="Follow some people to see their posts here"
            />
          ) : activeTab === "trending" ? (
            <EmptyState
              icon={Fire01Icon}
              title="No trending posts"
              subtitle="Check back later for trending content"
            />
          ) : (
            <EmptyState
              icon={Image01Icon}
              title="Nothing to see here"
              subtitle="Explore posts will appear here"
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}