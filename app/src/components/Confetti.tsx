import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { CONFETTI_COLORS } from '../data/packs';
import { C } from '../theme';

/** `@keyframes b1`…`b8` — where each scrap flies to, and how far it spins. */
const BURSTS = [
  { x: -120, y: -190, r: 320 },
  { x: 120, y: -200, r: -300 },
  { x: -190, y: -90, r: 200 },
  { x: 190, y: -70, r: -240 },
  { x: -60, y: -230, r: 180 },
  { x: 60, y: -240, r: -160 },
  { x: -215, y: 20, r: 260 },
  { x: 215, y: 10, r: -280 },
];

const BURST_EASING = Easing.bezier(0.2, 0.6, 0.3, 1);
const SIZE = 13;

function Scrap({ index }: { index: number }) {
  const b = BURSTS[index % 8];
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      index * 30,
      withTiming(1, { duration: 850 + (index % 4) * 120, easing: BURST_EASING }),
    );
  }, [t, index]);

  const anim = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: t.value * b.x },
      { translateY: t.value * b.y },
      { rotate: `${t.value * b.r}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderWidth: 2,
          borderColor: C.ink,
          backgroundColor: CONFETTI_COLORS[index],
          borderRadius: index % 3 ? 3 : 99,
        },
        anim,
      ]}
    />
  );
}

/** Fires once, from a point 120px up from the bottom of the stage. */
export function Confetti() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: '50%', bottom: 120, width: 0, height: 0 }}>
      {CONFETTI_COLORS.map((_, i) => (
        <Scrap key={i} index={i} />
      ))}
    </View>
  );
}
