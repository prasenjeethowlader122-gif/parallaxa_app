import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/Text";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "./UserAvatar";

interface StoryCircleProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  hasUnviewed?: boolean;
  isOwn?: boolean;
  onPress: () => void;
}

export function StoryCircle({ userId, username, avatarUrl, hasUnviewed = true, isOwn, onPress }: StoryCircleProps) {
  const colors = useColors();

  return (
    <TouchableOpacity className="items-center mx-1.5 w-[72px]" onPress={onPress} activeOpacity={0.8}>
      <View
        style={{
          borderRadius: 100,
          padding: 2,
          borderColor: hasUnviewed ? colors.story : colors.border,
          borderWidth: hasUnviewed ? 2.5 : 1,
        }}
      >
        <View
          style={{
            borderWidth: 2,
            borderRadius: 100,
            borderColor: colors.background,
            overflow: "hidden",
          }}
        >
          <UserAvatar uri={avatarUrl} size={56} />
        </View>
      </View>
      {isOwn && (
        <View
          className="absolute bottom-5 right-1 w-5 h-5 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text className="text-white text-sm font-bold leading-4">+</Text>
        </View>
      )}
      <Text
        className="text-xs mt-1 text-center w-16"
        style={{ color: colors.foreground }}
        numberOfLines={1}
      >
        {isOwn ? "Your story" : username}
      </Text>
    </TouchableOpacity>
  );
}
