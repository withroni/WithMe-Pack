import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SOFT_SPRING } from '../anim';
import { BORDER, C } from '../theme';

const PAD = 2.5;

/** The elastic fill from the prototype: `transition: width .5s cubic-bezier(.34,1.4,.64,1)`. */
export function ProgressBar({ pct, done }: { pct: number; done: boolean }) {
  const [track, setTrack] = useState(0);
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming((track * pct) / 100, { duration: 500, easing: SOFT_SPRING });
  }, [pct, track, w]);

  const fill = useAnimatedStyle(() => ({ width: Math.max(0, w.value) }));

  const onLayout = (e: LayoutChangeEvent) => setTrack(e.nativeEvent.layout.width);

  return (
    <View
      style={{
        marginTop: 11,
        height: 18,
        borderWidth: BORDER,
        borderColor: C.ink,
        borderRadius: 99,
        backgroundColor: C.white,
        overflow: 'hidden',
        padding: PAD,
      }}
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Animated.View
          style={[
            { height: '100%', borderRadius: 99, backgroundColor: done ? C.lime : C.orange },
            fill,
          ]}
        />
      </View>
    </View>
  );
}
