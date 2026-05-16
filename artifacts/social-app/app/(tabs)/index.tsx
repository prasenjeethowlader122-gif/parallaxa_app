import React, { useState, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetFeed, useGetExplorePosts, useGetStories } from "@workspace/api-client-react";
import { Image01Icon, FlashIcon, UserGroup02Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { StoryCircle } from "@/components/StoryCircle";
import { useAuth } from "@/context/AuthContext";
import { FeedSkeleton } from "@/components/SkeletonLoader";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "foryou" | "following" | "trending";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "foryou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

const GUEST_TABS: Tab[] = [
  { id: "foryou", label: "For You" },
  { id: "trending", label: "Trending" },
];

// ─── AnimatedTabIndicator ─────────────────────────────────────────────────────
// Slides a bottom-border under the active tab label with a spring animation.

interface AnimatedTabBarProps {
  activeTab: TabId;
  onPress: (id: TabId) => void;
  colors: ReturnType<typeof useColors>;
  tabs: Tab[];
}

function AnimatedTabBar({ activeTab, onPress, colors, tabs }: AnimatedTabBarProps) {
  // Measure each tab's x-offset + width so we can slide the indicator precisely.
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;

  function handleLayout(index: number, x: number, width: number) {
    tabLayouts.current[index] = { x, width };
    // Initialise indicator under the first tab on first layout
    if (index === 0 && tabs[0].id === activeTab) {
      indicatorX.setValue(x + 16);
      indicatorW.setValue(width - 32);
    }
  }

  function handlePress(tab: Tab, index: number) {
    onPress(tab.id);
    const layout = tabLayouts.current[index];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x + 16,
        speed: 20,
        bounciness: 6,
        useNativeDriver: false, // 'left' is a layout prop, needs false
      }),
      Animated.spring(indicatorW, {
        toValue: layout.width - 32,
        speed: 20,
        bounciness: 6,
        useNativeDriver: false,
      }),
    ]).start();
  }

  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#f1f1f1",
        backgroundColor: colors.background,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

        // Fade label opacity when tab changes
        Animated.timing(labelOpacity, {
          toValue: isActive ? 1 : 0.4,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handlePress(tab, index)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              handleLayout(index, x, width);
            }}
            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
            activeOpacity={0.8}
          >
            <Animated.Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                fontFamily: "Sora-SemiBold",
                color: colors.foreground,
                opacity: labelOpacity,
              }}
            >
              {tab.label}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}

      {/* Sliding indicator line */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: indicatorX,
          width: indicatorW,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.foreground,
        }}
      />
    </View>
  );
}

// ─── FeedScreen ───────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState < TabId > ("foryou");
  
  // "For You" & "Trending" — explore endpoint
  const {
    data: exploreData,
    isLoading: exploreLoading,
    isRefetching: exploreRefetching,
    refetch: refetchExplore,
  } = useGetExplorePosts();
  
  // "Following" — only fetch when that tab is active
  const {
    data: feedData,
    isLoading: feedLoading,
    isRefetching: feedRefetching,
    refetch: refetchFeed,
  } = useGetFeed({}, { query: { enabled: activeTab === "following" } as any });
  
  const isFollowingTab = activeTab === "following";
  const rawPosts: any[] = isFollowingTab ?
    Array.isArray(feedData?.posts) ? feedData.posts : [] :
    Array.isArray(exploreData?.posts) ? exploreData.posts : [];
  
  const isLoading = isFollowingTab ? feedLoading : exploreLoading;
  const isRefreshing = isFollowingTab ? feedRefetching : exploreRefetching;
  const refetch = isFollowingTab ? refetchFeed : refetchExplore;
  
  // Memoised sort — only re-computes when posts array or tab changes
  const displayPosts = useMemo(
    () =>
    activeTab === "trending" ?
    [...rawPosts].sort(
      (a: any, b: any) => (b.likesCount ?? 0) - (a.likesCount ?? 0)
    ) :
    rawPosts,
    [activeTab, rawPosts]
  );
  
  // ── Animated header (collapse on scroll) ──────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;
  const TAB_BAR_HEIGHT = 44;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0.96],
    extrapolate: "clamp",
  });
  
  // ── Empty state icon map ───────────────────────────────────────────────────
  const emptyIcon =
    activeTab === "following" ?
    UserGroup02Icon :
    activeTab === "trending" ?
    FlashIcon :
    Image01Icon;
  
  const emptyTitle =
    activeTab === "following" ?
    "No posts from following" :
    activeTab === "trending" ?
    "No trending posts" :
    "Nothing to see here";
  
  const emptySubtitle =
    activeTab === "following" ?
    "Follow some people to see their posts here" :
    activeTab === "trending" ?
    "Check back later for trending content" :
    "Explore posts will appear here";

  const StoryBar = () => {
    if (activeTab !== "foryou" || !user) return null;

    const { data: storyGroups } = useGetStories();

    const data = [
      { id: user.id, username: "You", avatarUrl: user.avatarUrl, isOwn: true, hasUnviewed: false },
      ...(storyGroups || []).map(group => ({
        id: group.user.id,
        username: group.user.username,
        avatarUrl: group.user.avatarUrl,
        isOwn: false,
        hasUnviewed: group.hasUnviewed,
      }))
    ];

    return (
      <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 8 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <StoryCircle
              userId={item.id}
              username={item.username}
              avatarUrl={item.avatarUrl}
              hasUnviewed={item.hasUnviewed}
              isOwn={item.isOwn}
              onPress={() => item.isOwn ? router.push('/story/create' as any) : router.push(`/story/${item.id}` as any)}
            />
          )}
        />
      </View>
    );
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {!user && (
        <View
          className="px-4 py-3 bg-blue-600 flex-row items-center justify-between"
          style={{ position: 'absolute', bottom: insets.bottom + 16, left: 16, right: 16, borderRadius: 12, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }}
        >
          <View className="flex-1 mr-4">
            <Text className="text-white font-bold text-sm">Join Parallaxa today!</Text>
            <Text className="text-blue-100 text-xs">Sign up now to get your own personalized feed!</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="bg-white px-4 py-2 rounded-full"
          >
            <Text className="text-blue-600 font-bold text-xs">Sign up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Animated tab bar ── */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <AnimatedTabBar
          activeTab={activeTab}
          onPress={setActiveTab}
          colors={colors}
          tabs={user ? TABS : GUEST_TABS}
        />
      </Animated.View>

      {/* ── Feed list ── */}
      <Animated.FlatList
        key={activeTab}
        data={isLoading ? [] : displayPosts}
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
            isSaved={item.isSaved ?? false}
            createdAt={item.createdAt}
          />
        )}
        ListHeaderComponent={
          <>
            <StoryBar />
            {/* Show skeleton cards while loading, inline above any real content */}
            {isLoading ? <FeedSkeleton count={5} /> : null}
          </>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              subtitle={emptySubtitle}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}