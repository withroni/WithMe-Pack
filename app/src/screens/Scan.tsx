import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeIn } from '../components/FadeIn';
import { StickerButton } from '../components/Sticker';
import { RECOGNIZED } from '../data/packs';
import { BORDER, C, F, ls } from '../theme';

const FRAME_H = 150;

/** `repeating-linear-gradient(135deg,#FFF3D6 0 9px,#FFE0AE 9px 18px)` */
const Stripes = () => (
  <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern id="stripes" width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <Rect width={18} height={18} fill={C.cream} />
        <Rect y={9} width={18} height={9} fill={C.sand} />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#stripes)" />
  </Svg>
);

/** `@keyframes shimmer` — the scan bar sweeping down the frame. */
function ScanBar() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(150, { duration: 1000, easing: Easing.linear }), -1, false);
  }, [y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 70 }, anim]}
    >
      <Svg width="100%" height={70}>
        <Defs>
          <LinearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.lime} stopOpacity={0} />
            <Stop offset="1" stopColor={C.lime} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={70} fill="url(#sweep)" />
      </Svg>
    </Animated.View>
  );
}

/** `@keyframes blink` */
function Blink({ children }: { children: React.ReactNode }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

function Token({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <StickerButton
      radius={99}
      shadow={on ? 2.5 : 0}
      shadowColor={C.orange}
      press={0}
      scaleTo={0.92}
      onPress={onPress}
      style={{
        height: 40,
        paddingHorizontal: 14,
        borderWidth: BORDER,
        borderColor: C.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: on ? C.ink : C.white,
      }}
    >
      <Text
        style={{
          fontFamily: F.bold,
          fontSize: 13.5,
          letterSpacing: ls(13.5, -0.02),
          color: on ? C.paper : C.faint,
        }}
      >
        {on ? '✓' : '＋'} {label}
      </Text>
    </StickerButton>
  );
}

export function Scan({
  scanning,
  photo,
  sel,
  onBack,
  onToggleToken,
  onAccept,
}: {
  scanning: boolean;
  photo: string | null;
  sel: string[];
  onBack: () => void;
  onToggleToken: (label: string) => void;
  onAccept: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ctaOn = sel.length > 0;

  return (
    <FadeIn
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        backgroundColor: C.paper,
        paddingTop: insets.top + 12,
        paddingHorizontal: 22,
        paddingBottom: insets.bottom + 22,
      }}
      duration={200}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <StickerButton
          radius={99}
          press={0}
          scaleTo={0.95}
          onPress={onBack}
          accessibilityLabel="뒤로"
          style={{
            height: 34,
            paddingHorizontal: 12,
            borderWidth: BORDER,
            borderColor: C.ink,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ls(11, 0.08), color: C.ink }}>
            ← BACK
          </Text>
        </StickerButton>

        {!scanning && (
          <Text style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: ls(11, 0.1), color: C.muted }}>
            {sel.length} SELECTED
          </Text>
        )}
      </View>

      <View
        style={{
          marginTop: 14,
          height: FRAME_H,
          borderWidth: BORDER,
          borderColor: C.ink,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <Stripes />
        {photo && <Image source={{ uri: photo }} resizeMode="cover" style={StyleSheet.absoluteFill} />}
        {scanning && <ScanBar />}
      </View>

      {scanning ? (
        <View style={{ marginTop: 22 }}>
          <Text style={{ fontFamily: F.xbold, fontSize: 21, letterSpacing: ls(21, -0.035), color: C.ink }}>
            사진에서 찾는 중…
          </Text>
          <View style={{ marginTop: 16 }}>
            <Blink>
              <Text style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: ls(12, 0.14), color: C.muted }}>
                SCANNING
              </Text>
            </Blink>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 18, flex: 1, minHeight: 0 }}>
          <Text style={{ fontFamily: F.xbold, fontSize: 21, letterSpacing: ls(21, -0.035), color: C.ink }}>
            {sel.length}개 찾았어요
          </Text>
          <Text style={{ marginTop: 6, fontFamily: F.reg, fontSize: 12.5, lineHeight: 18.75, color: C.muted }}>
            맞는 것만 남겨주세요. 빠진 건 나중에 추가하면 돼요.
          </Text>

          <ScrollView
            style={{ marginTop: 14, flex: 1 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 6 }}
            showsVerticalScrollIndicator={false}
          >
            {RECOGNIZED.map((label) => (
              <Token key={label} label={label} on={sel.includes(label)} onPress={() => onToggleToken(label)} />
            ))}
          </ScrollView>
        </View>
      )}

      <StickerButton
        radius={20}
        shadow={ctaOn ? 4 : 0}
        shadowColor={C.orange}
        disabled={!ctaOn}
        onPress={onAccept}
        wrapStyle={{ marginTop: 14 }}
        style={{
          height: 58,
          borderWidth: BORDER,
          borderColor: C.ink,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          backgroundColor: ctaOn ? C.ink : C.offBg,
        }}
      >
        <Text
          style={{
            fontFamily: F.xbold,
            fontSize: 16,
            letterSpacing: ls(16, -0.025),
            color: ctaOn ? C.paper : C.faint,
          }}
        >
          이 목록으로 시작
        </Text>
        <Text style={{ fontFamily: F.mono, fontSize: 13, color: ctaOn ? C.paper : C.faint, opacity: 0.8 }}>
          {sel.length ? `${sel.length}개` : ''}
        </Text>
      </StickerButton>
    </FadeIn>
  );
}
