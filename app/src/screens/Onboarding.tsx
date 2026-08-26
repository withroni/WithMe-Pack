import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashedBox } from '../components/DashedBox';
import { FadeIn } from '../components/FadeIn';
import { Sticker, StickerButton } from '../components/Sticker';
import { PACKS, PACK_KEYS } from '../data/packs';
import { BORDER, C, F, ls } from '../theme';
import type { PackKey } from '../types';

function PackCard({ packKey, onPress }: { packKey: PackKey; onPress: () => void }) {
  const p = PACKS[packKey];
  return (
    <StickerButton
      radius={20}
      shadow={4}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: C.white,
        borderWidth: BORDER,
        borderColor: C.ink,
        padding: 14,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderWidth: BORDER,
          borderColor: C.ink,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: p.color,
        }}
      >
        <Text style={{ fontFamily: F.mono, fontSize: 20, color: C.ink }}>{p.items.length}</Text>
        <Text
          style={{
            marginTop: 3,
            fontFamily: F.mono,
            fontSize: 8,
            letterSpacing: ls(8, 0.1),
            color: C.ink,
            opacity: 0.65,
          }}
        >
          ITEMS
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.xbold, fontSize: 17.5, letterSpacing: ls(17.5, -0.03), color: C.ink }}>
          {p.n}
        </Text>
        <Text style={{ marginTop: 4, fontFamily: F.reg, fontSize: 12.5, lineHeight: 18.1, color: C.muted }}>
          {p.d}
        </Text>
      </View>

      <Text style={{ fontFamily: F.mono, fontSize: 18, color: C.ink }}>→</Text>
    </StickerButton>
  );
}

export function Onboarding({
  onStartPack,
  onCamera,
}: {
  onStartPack: (k: PackKey) => void;
  onCamera: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <FadeIn style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row' }}>
          <Sticker
            radius={99}
            shadow={3}
            style={{
              backgroundColor: C.orange,
              borderWidth: BORDER,
              borderColor: C.ink,
              paddingVertical: 6,
              paddingHorizontal: 13,
            }}
          >
            <Text style={{ fontFamily: F.mono, fontSize: 11.5, letterSpacing: ls(11.5, 0.1), color: C.white }}>
              PACK IT
            </Text>
          </Sticker>
        </View>

        <Text
          style={{
            marginTop: 20,
            fontFamily: F.xbold,
            fontSize: 34,
            letterSpacing: ls(34, -0.045),
            lineHeight: 41.5,
            color: C.ink,
          }}
        >
          짐은 매번{'\n'}거의 똑같잖아요
        </Text>

        <Text style={{ marginTop: 12, fontFamily: F.reg, fontSize: 14, lineHeight: 22.4, color: C.muted }}>
          한 번만 만들어두면, 다음 여행엔{'\n'}체크만 하면 끝. 뭘로 시작할래요?
        </Text>

        <View style={{ marginTop: 26, gap: 12 }}>
          {PACK_KEYS.map((k) => (
            <PackCard key={k} packKey={k} onPress={() => onStartPack(k)} />
          ))}

          <Pressable accessibilityRole="button" onPress={onCamera}>
            <DashedBox
              radius={20}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 16,
                paddingHorizontal: 14,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderWidth: BORDER,
                  borderColor: C.ink,
                  borderRadius: 10,
                  backgroundColor: C.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.ink }}>◎</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: F.bold,
                  fontSize: 14.5,
                  letterSpacing: ls(14.5, -0.02),
                  color: C.ink,
                }}
              >
                가방 사진으로 만들기
              </Text>
              <View
                style={{
                  borderWidth: 2,
                  borderColor: C.ink,
                  borderRadius: 99,
                  paddingVertical: 4,
                  paddingHorizontal: 7,
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
    </FadeIn>
  );
}
