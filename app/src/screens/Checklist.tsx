import React, { useEffect } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPRINGY } from '../anim';
import { Confetti } from '../components/Confetti';
import { DashedBox } from '../components/DashedBox';
import { DOCK_HEIGHT } from '../components/Dock';
import { DoneSheet } from '../components/DoneSheet';
import { FadeIn } from '../components/FadeIn';
import { ItemRow } from '../components/ItemRow';
import { ProgressBar } from '../components/ProgressBar';
import { StickerButton } from '../components/Sticker';
import { Toast } from '../components/Toast';
import { BORDER, C, F, ls } from '../theme';
import type { Packing } from '../usePacking';

/** `@keyframes tick` — the headline count hops whenever the tally changes. */
function TickNumber({ value, bumpKey }: { value: number; bumpKey: string | null }) {
  const t = useSharedValue(1);

  useEffect(() => {
    if (!bumpKey) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 300, easing: SPRINGY });
  }, [bumpKey, t]);

  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 10 }, { scale: 0.7 + t.value * 0.3 }],
  }));

  return (
    <Animated.View style={anim}>
      <Text style={{ fontFamily: F.mono, fontSize: 46, lineHeight: 41.4, color: C.ink }}>{value}</Text>
    </Animated.View>
  );
}

export function Checklist({ p }: { p: Packing }) {
  const insets = useSafeAreaInsets();

  return (
    <FadeIn style={{ flex: 1 }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 22,
          paddingBottom: 14,
          backgroundColor: C.paper,
          borderBottomWidth: BORDER,
          borderBottomColor: C.ink,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {p.renaming ? (
            <TextInput
              value={p.nameDraft}
              onChangeText={p.setNameDraft}
              onSubmitEditing={p.commitName}
              onBlur={p.commitName}
              autoFocus
              returnKeyType="done"
              style={{
                flex: 1,
                padding: 0,
                paddingBottom: 2,
                fontFamily: F.xbold,
                fontSize: 25,
                letterSpacing: ls(25, -0.04),
                color: C.ink,
                borderBottomWidth: 3,
                borderBottomColor: C.orange,
              }}
            />
          ) : (
            <Text
              numberOfLines={1}
              style={{ flex: 1, fontFamily: F.xbold, fontSize: 25, letterSpacing: ls(25, -0.04), color: C.ink }}
            >
              {p.list?.name ?? ''}
            </Text>
          )}

          <StickerButton
            radius={12}
            shadow={2.5}
            press={2}
            onPress={p.startRename}
            accessibilityLabel="이름 수정"
            wrapStyle={{ width: 36, height: 36 }}
            style={{
              flex: 1,
              borderWidth: BORDER,
              borderColor: C.ink,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: C.ink }}>✎</Text>
          </StickerButton>
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <TickNumber value={p.allDone ? p.n : p.left} bumpKey={p.bump} />
          <Text
            style={{
              fontFamily: F.bold,
              fontSize: 14,
              letterSpacing: ls(14, -0.02),
              color: C.ink,
              paddingBottom: 5,
            }}
          >
            {p.allDone ? '개 전부 완료!' : '개 남았어요'}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: F.mono, fontSize: 12, color: C.muted, paddingBottom: 7 }}>
            {p.p} / {p.n}
          </Text>
        </View>

        <ProgressBar pct={p.pct} done={p.allDone} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 14,
          paddingHorizontal: 22,
          paddingBottom: DOCK_HEIGHT + insets.bottom + 40,
          gap: 9,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {p.items.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            bumped={p.bump === it.id}
            editing={p.editing === it.id}
            editDraft={p.editDraft}
            onChangeEdit={p.setEditDraft}
            onToggle={() => p.toggle(it.id)}
            onStartEdit={() => p.startEdit(it)}
            onCommitEdit={p.commitEdit}
            onRemove={() => p.remove(it.id)}
          />
        ))}

        <DashedBox
          radius={18}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 11,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderWidth: BORDER,
              borderColor: C.ink,
              borderRadius: 10,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: F.mono, fontSize: 15, color: C.ink }}>+</Text>
          </View>
          <TextInput
            value={p.draft}
            onChangeText={p.setDraft}
            onSubmitEditing={p.addItem}
            // Keep focus so several items can be added in a row.
            submitBehavior="submit"
            returnKeyType="done"
            placeholder="뭐 더 챙길까요?"
            placeholderTextColor={C.faint}
            style={{
              flex: 1,
              minWidth: 0,
              padding: 0,
              // Keeps it above DashedBox's absolutely-positioned outline on web.
              position: 'relative',
              fontFamily: F.semi,
              fontSize: 16,
              letterSpacing: ls(16, -0.02),
              color: C.ink,
            }}
          />
        </DashedBox>
      </ScrollView>

      {p.allDone && <Confetti />}

      {/*
        Both the toast and the completion sheet are bottom-anchored. The
        prototype let them overlap — on a real screen the toast then sat on top
        of the sheet's only button, so they stack instead.
      */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 45 }}
      >
        {!!p.toastMsg && <Toast message={p.toastMsg} canUndo={!!p.undo} onUndo={p.doUndo} />}
        {p.allDone && <DoneSheet total={p.n} onRestart={() => p.restart()} />}
      </View>
    </FadeIn>
  );
}
