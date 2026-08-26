import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EASE } from '../anim';

/** `@keyframes fadein` — opacity 0→1 with a 0.98→1 settle. */
export function FadeIn({
  children,
  style,
  duration = 240,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration, easing: EASE });
  }, [t, duration]);

  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 0.98 + t.value * 0.02 }],
  }));

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
