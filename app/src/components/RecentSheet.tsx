import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHEET, SOFT_SPRING } from '../anim';
import { PACKS, PACK_KEYS } from '../data/packs';
import { BORDER, C, F, ls } from '../theme';
import type { PackKey, Snapshot } from '../types';
import { DOCK_HEIGHT } from './Dock';
import { DashedBox } from './DashedBox';
import { Sticker, StickerButton } from './Sticker';

const RADIUS = 34;

/** `@keyframes cardup` — history cards deal in one after another when the sheet opens. */
function HistoryCard({ snap, index, open, onPress }: { snap: Snapshot; index: number; open: boolean; onPress: () => void }) {
  const t = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (!open) {
      t.value = 0;
      return;
    }
    t.value = withDelay(40 + index * 50, withTiming(1, { duration: 340, easing: SOFT_SPRING }));
  }, [open, index, t]);

  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 26 }],
  }));

  const preview =
    snap.items.slice(0, 6).map((i) => i.label).join(' · ') + (snap.items.length > 6 ? ' …' : '');

  return (
    <Animated.View style={anim}>
      <StickerButton
        radius={18}
        shadow={3}
        onPress={onPress}
        style={{ backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 13 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontFamily: F.xbold, fontSize: 15.5, letterSpacing: ls(15.5, -0.03), color: C.ink }}
          >
            {snap.name}
          </Text>
          <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.muted }}>
            {snap.created} · {snap.p}/{snap.n}
          </Text>
        </View>
        <Text numberOfLines={1} style={{ marginTop: 7, fontFamily: F.reg, fontSize: 12.5, color: C.muted }}>
          {preview}
        </Text>
      </StickerButton>
    </Animated.View>
  );
}

function PackCard({ packKey, onPress }: { packKey: PackKey; onPress: () => void }) {
  const p = PACKS[packKey];
  return (
    <StickerButton
      radius={18}
      shadow={3}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.white,
        borderWidth: BORDER,
        borderColor: C.ink,
        padding: 12,
      }}
    >
      <View
        style={{
          minWidth: 42,
          height: 42,
          borderWidth: BORDER,
          borderColor: C.ink,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: p.color,
        }}
      >
        <Text style={{ fontFamily: F.mono, fontSize: 16, color: C.ink }}>{p.items.length}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.xbold, fontSize: 15.5, letterSpacing: ls(15.5, -0.03), color: C.ink }}>
          {p.n}
        </Text>
        <Text style={{ marginTop: 3, fontFamily: F.reg, fontSize: 12, color: C.muted }}>{p.c}</Text>
      </View>
      <Text style={{ fontFamily: F.mono, fontSize: 16, color: C.ink }}>→</Text>
    </StickerButton>
  );
}

export function RecentSheet({
  open,
  height,
  hist,
  onClose,
  onToggle,
  onRestore,
  onStartPack,
  onCamera,
}: {
  open: boolean;
  height: number;
  hist: Snapshot[];
  onClose: () => void;
  onToggle: () => void;
  onRestore: (h: Snapshot) => void;
  onStartPack: (k: PackKey) => void;
  onCamera: () => void;
}) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(height);
  const start = useSharedValue(0);

  useEffect(() => {
    y.value = withTiming(open ? 0 : height, { duration: 420, easing: SHEET });
  }, [open, height, y]);

  // Drag the handle down to dismiss — the affordance a real sheet is expected to
  // have. Racing a tap against it keeps the prototype's tap-the-handle-to-close.
  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = y.value;
    })
    .onUpdate((e) => {
      y.value = Math.max(0, start.value + e.translationY);
    })
    .onEnd((e) => {
      if (y.value > height * 0.28 || e.velocityY > 800) {
        y.value = withTiming(height, { duration: 280, easing: SHEET });
        runOnJS(onClose)();
      } else {
        y.value = withTiming(0, { duration: 280, easing: SHEET });
      }
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onToggle)();
  });

  const headerGesture = Gesture.Race(tap, pan);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height, zIndex: 16 }, anim]}
    >
      {/* `box-shadow: 0 -10px 0 #17140F1A` */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -10,
          bottom: 0,
          borderTopLeftRadius: RADIUS,
          borderTopRightRadius: RADIUS,
          backgroundColor: 'rgba(23,20,15,0.10)',
        }}
      />

      <View
        style={{
          flex: 1,
          backgroundColor: C.paper,
          borderTopWidth: 3.5,
          borderTopColor: C.ink,
          borderTopLeftRadius: RADIUS,
          borderTopRightRadius: RADIUS,
          overflow: 'hidden',
        }}
      >
        <GestureDetector gesture={headerGesture}>
          <View accessibilityRole="button" accessibilityLabel="시트 닫기">
            <View style={{ paddingTop: 12, paddingBottom: 6, alignItems: 'center' }}>
              <View style={{ width: 56, height: 6, borderRadius: 99, backgroundColor: C.ink }} />
            </View>

            <View
              style={{
                paddingTop: 2,
                paddingHorizontal: 22,
                paddingBottom: 12,
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 10,
              }}
            >
              <Text style={{ flex: 1, fontFamily: F.xbold, fontSize: 24, letterSpacing: ls(24, -0.04), color: C.ink }}>
                최근 체크리스트
              </Text>
              {hist.length > 0 && (
                <Text
                  style={{
                    fontFamily: F.mono,
                    fontSize: 11,
                    letterSpacing: ls(11, 0.1),
                    color: C.muted,
                    paddingBottom: 5,
                  }}
                >
                  {hist.length} SAVED
                </Text>
              )}
            </View>
          </View>
        </GestureDetector>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: DOCK_HEIGHT + insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {hist.length === 0 && (
            <DashedBox radius={18} style={{ paddingVertical: 22, paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: F.reg, fontSize: 13, lineHeight: 20.8, color: C.muted }}>
                아직 지난 목록이 없어요.{'\n'}지금 목록을 마무리하면 여기 쌓입니다.
              </Text>
            </DashedBox>
          )}

          <View style={{ gap: 9 }}>
            {hist.map((h, i) => (
              <HistoryCard key={`${h.created}-${h.name}-${i}`} snap={h} index={i} open={open} onPress={() => onRestore(h)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 24 }}>
            <Sticker
              radius={99}
              shadow={3}
              style={{
                backgroundColor: C.blue,
                borderWidth: BORDER,
                borderColor: C.ink,
                paddingVertical: 5,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: ls(10.5, 0.12), color: C.white }}>
                기본 목록
              </Text>
            </Sticker>
          </View>

          <View style={{ marginTop: 12, gap: 9 }}>
            {PACK_KEYS.map((k) => (
              <PackCard key={k} packKey={k} onPress={() => onStartPack(k)} />
            ))}

            <Pressable accessibilityRole="button" onPress={onCamera}>
              <DashedBox
                radius={18}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: BORDER,
                    borderColor: C.ink,
                    borderRadius: 10,
                    backgroundColor: C.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: F.mono, fontSize: 12, color: C.ink }}>◎</Text>
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: F.bold,
                    fontSize: 14,
                    letterSpacing: ls(14, -0.02),
                    color: C.ink,
                  }}
                >
                  가방 사진으로 새로 만들기
                </Text>
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: C.ink,
                    borderRadius: 99,
                    paddingVertical: 3,
                    paddingHorizontal: 6,
                    backgroundColor: C.lime,
                  }}
                >
                  <Text style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: ls(9.5, 0.12), color: C.ink }}>
                    DEMO
                  </Text>
                </View>
              </DashedBox>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}
