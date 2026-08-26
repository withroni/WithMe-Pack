import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { C } from '../theme';

/**
 * The prototype's whole look rests on `box-shadow: 4px 4px 0 #17140F` — a hard,
 * unblurred offset block. React Native's `shadow*`/`elevation` can only produce
 * blurred shadows, so we paint the shadow as a solid sibling View sitting behind
 * the content, offset by the same amount.
 *
 * Pressing does NOT move that block: in CSS `transform:translate(3px,3px)` paired
 * with `box-shadow:0 0 0` leaves the shadow at the same absolute position while
 * the content slides onto it. So only the inner box animates.
 */

type Base = {
  radius: number;
  /** Hard shadow offset in px; 0 draws no shadow. */
  shadow?: number;
  shadowColor?: string;
  /** Layout box — flex, width, margins. */
  wrapStyle?: StyleProp<ViewStyle>;
  /** Visual box — background, border, padding. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const ShadowBlock = ({ offset, radius, color }: { offset: number; radius: number; color: string }) =>
  offset > 0 ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: offset,
        top: offset,
        right: -offset,
        bottom: -offset,
        borderRadius: radius,
        backgroundColor: color,
      }}
    />
  ) : null;

export function Sticker({ radius, shadow = 0, shadowColor = C.ink, wrapStyle, style, children }: Base) {
  return (
    <View style={wrapStyle}>
      <ShadowBlock offset={shadow} radius={radius} color={shadowColor} />
      <View style={[{ borderRadius: radius }, style]}>{children}</View>
    </View>
  );
}

type ButtonProps = Base & {
  onPress?: () => void;
  disabled?: boolean;
  /** How far the content slides toward the shadow while held. */
  press?: number;
  /** Extra squash on press, e.g. 0.96. */
  scaleTo?: number;
  accessibilityLabel?: string;
  hitSlop?: number;
};

const IN = { duration: 110, easing: Easing.out(Easing.quad) };
const OUT = { duration: 170, easing: Easing.bezier(0.34, 1.56, 0.64, 1) };

export function StickerButton({
  radius,
  shadow = 0,
  shadowColor = C.ink,
  wrapStyle,
  style,
  children,
  onPress,
  disabled,
  press = 3,
  scaleTo = 1,
  accessibilityLabel,
  hitSlop,
}: ButtonProps) {
  const t = useSharedValue(0);

  const inner = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * press },
      { translateY: t.value * press },
      { scale: 1 - t.value * (1 - scaleTo) },
    ],
  }));

  return (
    <Pressable
      style={wrapStyle}
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={() => {
        if (!disabled) t.value = withTiming(1, IN);
      }}
      onPressOut={() => {
        t.value = withTiming(0, OUT);
      }}
    >
      <ShadowBlock offset={disabled ? 0 : shadow} radius={radius} color={shadowColor} />
      <Animated.View style={[{ borderRadius: radius }, style, inner]}>{children}</Animated.View>
    </Pressable>
  );
}
