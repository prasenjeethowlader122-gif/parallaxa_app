import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/Text";
import { useColors } from "@/hooks/useColors";
import { HugeiconsIcon } from "@hugeicons/react-native";

interface EmptyStateProps {
  icon: any;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View className="flex-1 items-center justify-center p-10">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: colors.muted }}
      >
        <HugeiconsIcon icon={icon} size={36} color={colors.mutedForeground} />
      </View>
      <Text
        className="text-lg font-semibold text-center mb-2"
        style={{ color: colors.foreground }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className="text-sm text-center leading-5 mb-6"
          style={{ color: colors.mutedForeground }}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="px-6 py-3 rounded-lg"
          style={{ backgroundColor: colors.primary }}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
