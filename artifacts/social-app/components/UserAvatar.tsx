import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  hasStory?: boolean;
  hasUnviewedStory?: boolean;
}

export function UserAvatar({ uri, size = 40, hasStory, hasUnviewedStory }: UserAvatarProps) {
  const colors = useColors();
  const borderWidth = hasStory ? 2 : 0;
  const borderColor = hasUnviewedStory ? colors.story : colors.border;
  const outerSize = size + borderWidth * 2 + (hasStory ? 4 : 0);

  return (
    <View
      style={[
        styles.outerRing,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: hasStory ? 2 : 0,
          borderColor,
          padding: hasStory ? 2 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.muted,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Feather name="user" size={size * 0.5} color={colors.mutedForeground} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    overflow: "hidden",
  },
  avatar: {
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});
