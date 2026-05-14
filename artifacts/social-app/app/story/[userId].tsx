import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { useGetStories, useViewStory, useReactStory, useDeleteStoryReaction } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import remoteConfig from "@react-native-firebase/remote-config";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function StoryViewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { data: storyGroups, isLoading, refetch } = useGetStories();
  const { mutate: viewStory } = useViewStory();
  const { mutate: reactStory } = useReactStory();
  const { mutate: deleteReaction } = useDeleteStoryReaction();

  const group = storyGroups?.find((g) => g.user.id === userId);
  const stories = group?.stories || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      contentOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(setCurrentIndex)(currentIndex + 1);
          contentOpacity.value = withTiming(1, { duration: 150 });
        }
      });
    } else {
      router.back();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      contentOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(setCurrentIndex)(currentIndex - 1);
          contentOpacity.value = withTiming(1, { duration: 150 });
        }
      });
    }
  };

  useEffect(() => {
    if (stories.length > 0) {
      const currentStory = stories[currentIndex];
      if (!currentStory.isViewed) {
        viewStory({ storyId: currentStory.id });
      }

      const storyDuration = remoteConfig().getValue('story_duration').asNumber() || currentStory.duration || 5;

      progress.value = 0;
      progress.value = withTiming(1, {
        duration: storyDuration * 1000,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(nextStory)();
        }
      });
    }
  }, [currentIndex, stories.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleReact = (emoji: string) => {
    const currentStory = stories[currentIndex];
    if (currentStory.myReaction === emoji) {
      deleteReaction({ storyId: currentStory.id }, {
        onSuccess: () => refetch()
      });
    } else {
      reactStory({
        storyId: currentStory.id,
        data: { emoji }
      }, {
        onSuccess: () => refetch()
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#000", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!group || stories.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: "#000", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff" }}>No stories found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Animated.View style={[styles.media, contentAnimatedStyle]}>
        {currentStory.mediaType === "image" ? (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.media, { backgroundColor: "#333", justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#fff" }}>Video Preview Not Supported</Text>
          </View>
        )}
      </Animated.View>

      {/* Touch regions for navigation */}
      <View style={styles.touchContainer}>
        <TouchableOpacity style={styles.touchSide} onPress={prevStory} activeOpacity={1} />
        <TouchableOpacity style={styles.touchSide} onPress={nextStory} activeOpacity={1} />
      </View>

      {/* Header Overlay */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              {index < currentIndex ? (
                <View style={[styles.progressBarFilled, { width: "100%" }]} />
              ) : index === currentIndex ? (
                <Animated.View style={[styles.progressBarFilled, progressStyle]} />
              ) : null}
            </View>
          ))}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <UserAvatar uri={group.user.avatarUrl} size={36} />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {group.user.displayName}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                @{group.user.username}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.back()} hitSlop={15}>
            <HugeiconsIcon icon={Cancel01Icon} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reactions Overlay */}
      {remoteConfig().getValue('enable_reactions').asBoolean() && (
        <View style={[styles.reactionsContainer, { paddingBottom: insets.bottom + 20 }]}>
          {/* Reaction Summary */}
          {currentStory.reactions && currentStory.reactions.length > 0 && (
            <View style={styles.reactionSummary}>
              {currentStory.reactions.map((r: any) => (
                <View key={r.emoji} style={styles.reactionCount}>
                  <Text style={{ fontSize: 12 }}>{r.emoji}</Text>
                  <Text style={{ color: "#fff", fontSize: 10, marginLeft: 2, fontWeight: "600" }}>{r.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reaction Bar */}
          <View style={styles.reactionPicker}>
            {["❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReact(emoji)}
                style={[
                  styles.reactionButton,
                  currentStory.myReaction === emoji && { backgroundColor: "rgba(255,255,255,0.4)" }
                ]}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    width: width,
    height: height,
    position: 'absolute',
  },
  touchContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  touchSide: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  progressContainer: {
    flexDirection: "row",
    height: 2,
    gap: 4,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBarFilled: {
    height: "100%",
    backgroundColor: "#fff",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reactionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  reactionSummary: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  reactionCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
