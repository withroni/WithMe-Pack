import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPRINGY } from '../anim';
import { BORDER, C, F, ls } from '../theme';
import { CheckAllIcon, NotebookIcon, SaveIcon } from './Icons';
import { StickerButton } from './Sticker';

export const DOCK_HEIGHT = 86;

const label = {
  fontFamily: F.xbold,
  fontSize: 14,
  letterSpacing: ls(14, -0.02),
};

export function Dock({
  canAct,
  sheetOpen,
  onSave,
  onToggleSheet,
  onCheckAll,
}: {
  canAct: boolean;
  sheetOpen: boolean;
  onSave: () => void;
  onToggleSheet: () => void;
  onCheckAll: () => void;
}) {
  const insets = useSafeAreaInsets();
  const s = useSharedValue(sheetOpen ? 1 : 0);

  useEffect(() => {
    s.value = withTiming(sheetOpen ? 1 : 0, { duration: 300, easing: SPRINGY });
  }, [sheetOpen, s]);

  // Painted inside the 3px stroke, so the fill animates without touching the border.
  const centreFill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.value, [0, 1], [C.ink, C.orange]),
  }));
  const centreIcon = useAnimatedStyle(() => ({
    transform: [{ rotate: `${s.value * -8}deg` }, { scale: 1 - s.value * 0.08 }],
  }));

  const side = {
    height: 54,
    borderWidth: BORDER,
    borderColor: C.ink,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 9,
  };

  return (
    <View
      style={{
        height: DOCK_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        zIndex: 18,
        borderTopWidth: 3,
        borderTopColor: C.ink,
        backgroundColor: C.cream,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
      }}
    >
      <StickerButton
        radius={18}
        shadow={3}
        disabled={!canAct}
        onPress={onSave}
        accessibilityLabel="여기까지 저장"
        wrapStyle={{ flex: 1 }}
        style={{ ...side, backgroundColor: canAct ? C.orange : C.offBg }}
      >
        <SaveIcon size={21} color={canAct ? C.white : C.faint} />
        <Text style={[label, { color: canAct ? C.white : C.faint }]}>저장</Text>
      </StickerButton>

      <StickerButton
        radius={22}
        shadow={4}
        press={4}
        scaleTo={0.96}
        onPress={onToggleSheet}
        accessibilityLabel="최근 체크리스트"
        wrapStyle={{ width: 66, height: 66 }}
        style={{
          flex: 1,
          borderWidth: 3,
          borderColor: C.ink,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFill, centreFill]} />
        <Animated.View style={centreIcon}>
          <NotebookIcon size={28} color={sheetOpen ? C.white : C.paper} />
        </Animated.View>
      </StickerButton>

      <StickerButton
        radius={18}
        shadow={3}
        disabled={!canAct}
        onPress={onCheckAll}
        accessibilityLabel="전부 체크"
        wrapStyle={{ flex: 1 }}
        style={{ ...side, backgroundColor: canAct ? C.lime : C.offBg }}
      >
        <CheckAllIcon size={23} color={canAct ? C.ink : C.faint} />
        <Text style={[label, { color: canAct ? C.ink : C.faint }]}>전부</Text>
      </StickerButton>
    </View>
  );
}
