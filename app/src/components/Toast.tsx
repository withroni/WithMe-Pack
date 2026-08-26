import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SOFT_SPRING } from '../anim';
import { C, F, ls } from '../theme';
import { StickerButton } from './Sticker';

/** `@keyframes toastin` — up from 80px with a 2° kick. */
export function Toast({ message, canUndo, onUndo }: { message: string; canUndo: boolean; onUndo: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: 300, easing: SOFT_SPRING });
  }, [message, t]);

  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 80 }, { rotate: `${(1 - t.value) * -2}deg` }],
  }));

  return (
    <View pointerEvents="box-none" style={{ marginHorizontal: 14, marginBottom: 14 }}>
      <Animated.View
        style={[
          {
            backgroundColor: C.ink,
            borderRadius: 20,
            minHeight: 54,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 16,
            paddingRight: 8,
            paddingVertical: 7,
          },
          anim,
        ]}
      >
        <Text style={{ flex: 1, fontFamily: F.semi, fontSize: 13, letterSpacing: ls(13, -0.02), color: C.paper }}>
          {message}
        </Text>

        {canUndo && (
          <StickerButton
            radius={12}
            press={0}
            scaleTo={0.94}
            onPress={onUndo}
            style={{
              height: 40,
              paddingHorizontal: 14,
              backgroundColor: C.orange,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ls(11, 0.08), color: C.white }}>
              UNDO
            </Text>
          </StickerButton>
        )}
      </Animated.View>
    </View>
  );
}
