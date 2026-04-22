import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const Dot = ({ delay }: { delay: number }) => {
  const colors = useColors();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: colors.mutedForeground },
        animatedStyle,
      ]}
    />
  );
};

export const TypingIndicator = () => {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginLeft: 4,
    height: 32,
    width: 52,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
