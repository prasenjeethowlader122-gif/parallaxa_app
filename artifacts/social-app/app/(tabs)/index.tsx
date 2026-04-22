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
import { useGetFeed, useGetExplorePosts } from "@workspace/api-client-react";
import { Image01Icon, FlashIcon, UserGroup02Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { FeedSkeleton } from "@/components/SkeletonLoader";

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

// ─── AnimatedTabIndicator ─────────────────────────────────────────────────────
// Slides a bottom-border under the active tab label with a spring animation.

interface AnimatedTabBarProps {
  activeTab: TabId;
  onPress: (id: TabId) => void;
  colors: ReturnType < typeof useColors > ;
}

function AnimatedTabBar({ activeTab, onPress, colors }: AnimatedTabBarProps) {
  // Measure each tab's x-offset + width so we can slide the indicator precisely.
  const tabLayouts = useRef < { x: number;width: number } [] > ([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;
  
  function handleLayout(index: number, x: number, width: number) {
    tabLayouts.current[index] = { x, width };
    // Initialise indicator under the first tab on first layout
    if (index === 0 && TABS[0].id === activeTab) {
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
        borderBottomColor: '#f1f1f1',
        backgroundColor: colors.background,
      }}
    >
      {TABS.map((tab, index) => {
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
            style={{ paddingVertical: 13, paddingHorizontal: 16 }}
            activeOpacity={0.8}
          >
            <Animated.Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                fontFamily: 'Sora-SemiBold',
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
          height: 1,
          borderRadius: 1,
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
  } = useGetFeed({ enabled: activeTab === "following" });
  
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
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* ── Animated tab bar ── */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <AnimatedTabBar
          activeTab={activeTab}
          onPress={setActiveTab}
          colors={colors}
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
          // Show skeleton cards while loading, inline above any real content
          isLoading ? <FeedSkeleton count={5} /> : null
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