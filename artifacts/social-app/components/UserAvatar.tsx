import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { UserIcon } from "@hugeicons/core-free-icons";

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  hasStory?: boolean;
  hasUnviewedStory?: boolean;
}

export function UserAvatar({ uri, size = 40, hasStory, hasUnviewedStory }: UserAvatarProps) {
  const colors = useColors();
  const borderWidth = hasStory ? 2 : 0;
  const outerSize = size + borderWidth * 2 + (hasStory ? 4 : 0);
  const borderColor = hasUnviewedStory ? colors.story : colors.border;

  return (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius: outerSize / 2,
        borderWidth: hasStory ? 2 : 0,
        borderColor,
        padding: hasStory ? 2 : 0,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            contentFit="cover"
          />
        ) : (
          <HugeiconsIcon icon={UserIcon} size={size * 0.5} color={colors.mutedForeground} />
        )}
      </View>
    </View>
  );
}
