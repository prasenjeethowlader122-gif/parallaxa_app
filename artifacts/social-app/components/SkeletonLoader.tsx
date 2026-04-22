/**
 * SkeletonLoader.tsx
 *
 * Drop-in skeleton system for the social feed.
 * Uses only React Native's built-in `Animated` API — no third-party deps.
 *
 * Exports:
 *   - SkeletonBox          — base shimmer block
 *   - PostCardSkeleton     — single post card placeholder
 *   - FeedSkeleton         — stacked list of PostCardSkeletons
 *   - TabBarSkeleton       — tab bar placeholder (optional)
 *
 * Usage:
 *   import { FeedSkeleton } from "@/components/SkeletonLoader";
 *   {isLoading && <FeedSkeleton count={5} />}
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  useWindowDimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Delay (ms) before shimmer starts — used for staggered entrance */
  delay?: number;
}

// ─── Core shimmer hook ────────────────────────────────────────────────────────

function useShimmer(delay = 0) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay]);

  return shimmer;
}

// ─── Fade-in mount animation ──────────────────────────────────────────────────

function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
}

// ─── SkeletonBox ──────────────────────────────────────────────────────────────

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
  delay = 0,
}: SkeletonBoxProps) {
  const colors = useColors();
  const shimmer = useShimmer(delay);

  // Interpolate opacity between base and highlight
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── PostCardSkeleton ─────────────────────────────────────────────────────────

interface PostCardSkeletonProps {
  /** Controls entrance stagger */
  index?: number;
  /** Whether to show an image placeholder */
  showImage?: boolean;
}

export function PostCardSkeleton({
  index = 0,
  showImage = true,
}: PostCardSkeletonProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const fadeIn = useFadeIn(index * 80); // staggered by card position
  const delay = (index % 3) * 200; // stagger shimmer phase per card

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          opacity: fadeIn,
        },
      ]}
    >
      {/* ── Author row ── */}
      <View style={styles.authorRow}>
        {/* Avatar circle */}
        <SkeletonBox
          width={40}
          height={40}
          borderRadius={20}
          delay={delay}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1, gap: 6 }}>
          {/* Name */}
          <SkeletonBox width="45%" height={13} borderRadius={6} delay={delay} />
          {/* Handle + timestamp */}
          <SkeletonBox width="30%" height={11} borderRadius={6} delay={delay + 80} />
        </View>
        {/* More icon placeholder */}
        <SkeletonBox width={20} height={20} borderRadius={4} delay={delay} />
      </View>

      {/* ── Content lines ── */}
      <View style={styles.contentBlock}>
        <SkeletonBox height={13} borderRadius={6} delay={delay + 50} />
        <SkeletonBox width="88%" height={13} borderRadius={6} delay={delay + 100} />
        <SkeletonBox width="60%" height={13} borderRadius={6} delay={delay + 150} />
      </View>

      {/* ── Image placeholder ── */}
      {showImage && (
        <SkeletonBox
          height={width * 0.52}
          borderRadius={12}
          delay={delay + 100}
          style={{ marginBottom: 14 }}
        />
      )}

      {/* ── Hashtag pills ── */}
      <View style={styles.hashtagRow}>
        {[70, 90, 60].map((w, i) => (
          <SkeletonBox
            key={i}
            width={w}
            height={24}
            borderRadius={12}
            delay={delay + i * 60}
          />
        ))}
      </View>

      {/* ── Action bar ── */}
      <View style={styles.actionRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.actionItem}>
            <SkeletonBox width={22} height={22} borderRadius={11} delay={delay + i * 50} />
            <SkeletonBox width={28} height={11} borderRadius={5} delay={delay + i * 50 + 30} />
          </View>
        ))}
        <SkeletonBox width={22} height={22} borderRadius={11} delay={delay + 180} />
      </View>
    </Animated.View>
  );
}

// ─── FeedSkeleton ─────────────────────────────────────────────────────────────

interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 4 }: FeedSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton
          key={i}
          index={i}
          // Only the first 2 cards show an image placeholder
          showImage={i < 2}
        />
      ))}
    </>
  );
}

// ─── TabBarSkeleton (optional) ────────────────────────────────────────────────

export function TabBarSkeleton() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.tabBar,
        {
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      {[80, 90, 80].map((w, i) => (
        <SkeletonBox
          key={i}
          width={w}
          height={13}
          borderRadius={6}
          delay={i * 100}
          style={{ marginHorizontal: 16 }}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contentBlock: {
    gap: 8,
    marginBottom: 14,
  },
  hashtagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});