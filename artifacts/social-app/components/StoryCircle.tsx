import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.ring,
          {
            borderColor: hasUnviewed ? colors.story : colors.border,
            borderWidth: hasUnviewed ? 2.5 : 1,
          },
        ]}
      >
        <View style={[styles.innerRing, { borderColor: colors.background }]}>
          <UserAvatar uri={avatarUrl} size={56} />
        </View>
      </View>
      {isOwn && (
        <View style={[styles.addBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text style={styles.addText}>+</Text>
        </View>
      )}
      <Text style={[styles.username, { color: colors.foreground }]} numberOfLines={1}>
        {isOwn ? "Your story" : username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: 6,
    width: 72,
  },
  ring: {
    borderRadius: 100,
    padding: 2,
  },
  innerRing: {
    borderWidth: 2,
    borderRadius: 100,
    overflow: "hidden",
  },
  addBadge: {
    position: "absolute",
    bottom: 20,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  username: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    width: 64,
  },
});
