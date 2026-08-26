import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SOFT_SPRING } from '../anim';
import { BORDER, C, F, ls } from '../theme';
import { StickerButton } from './Sticker';

/** `@keyframes wiggle` — the ✓ badge rocking ±2°. */
function WigglyCheck() {
  const r = useSharedValue(-2);
  useEffect(() => {
    r.value = withRepeat(withTiming(2, { duration: 550 }), -1, true);
  }, [r]);
  const anim = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));

  return (
    <Animated.View
      style={[
        {
          width: 30,
          height: 30,
          borderWidth: BORDER,
          borderColor: C.paper,
          borderRadius: 10,
          backgroundColor: C.lime,
          alignItems: 'center',
          justifyContent: 'center',
        },
        anim,
      ]}
    >
      <Text style={{ fontFamily: F.mono, fontSize: 15, color: C.ink }}>✓</Text>
    </Animated.View>
  );
}

/** `@keyframes rise` — slides up from below with a small overshoot. */
export function DoneSheet({ total, onRestart }: { total: number; onRestart: () => void }) {
  const [h, setH] = useState(0);
  const y = useSharedValue(0);

  useEffect(() => {
    if (!h) return;
    y.value = h * 1.2;
    y.value = withSequence(
      withTiming(-8, { duration: 350, easing: SOFT_SPRING }),
      withTiming(0, { duration: 150, easing: SOFT_SPRING }),
    );
  }, [h, y]);

  const anim = useAnimatedStyle(() => ({ opacity: h ? 1 : 0, transform: [{ translateY: y.value }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (next && next !== h) setH(next);
  };

  return (
    <View pointerEvents="box-none">
      <Animated.View
        onLayout={onLayout}
        style={[
          {
            marginHorizontal: 14,
            marginBottom: 16,
            backgroundColor: C.ink,
            borderRadius: 24,
            paddingTop: 18,
            paddingHorizontal: 18,
            paddingBottom: 16,
          },
          anim,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <WigglyCheck />
          <Text style={{ fontFamily: F.xbold, fontSize: 19, letterSpacing: ls(19, -0.03), color: C.paper }}>
            다 챙겼다!
          </Text>
        </View>

        <Text style={{ marginTop: 7, fontFamily: F.reg, fontSize: 12.5, color: C.faint }}>
          {total}개 전부 체크. 가방 닫아도 돼요.
        </Text>

        <StickerButton
          radius={16}
          press={0}
          scaleTo={0.97}
          wrapStyle={{ marginTop: 14 }}
          onPress={onRestart}
          style={{
            height: 50,
            backgroundColor: C.lime,
            borderWidth: BORDER,
            borderColor: C.paper,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: F.xbold, fontSize: 14.5, letterSpacing: ls(14.5, -0.02), color: C.ink }}>
            보관함에 넣고 새로 시작
          </Text>
        </StickerButton>
      </Animated.View>
    </View>
  );
}
