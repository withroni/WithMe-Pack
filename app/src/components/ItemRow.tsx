import React, { useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SPRINGY } from '../anim';
import { BORDER, C, F, ls } from '../theme';
import type { Item } from '../types';

const RADIUS = 18;
const SHADOW = 4;
/** Done rows sit 2px lower with a 1px sliver of shadow left showing. */
const DONE_SHIFT = 2;
const DONE_SHADOW_SHIFT = -1;

export function ItemRow({
  item,
  bumped,
  editing,
  editDraft,
  onChangeEdit,
  onToggle,
  onStartEdit,
  onCommitEdit,
  onRemove,
}: {
  item: Item;
  bumped: boolean;
  editing: boolean;
  editDraft: string;
  onChangeEdit: (v: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onRemove: () => void;
}) {
  const pop = useSharedValue(0);
  const d = useSharedValue(item.done ? 1 : 0);

  useEffect(() => {
    d.value = withTiming(item.done ? 1 : 0, { duration: 200 });
  }, [item.done, d]);

  // `@keyframes pop` — 0→40% out to scale 1.32 / -7deg, then back.
  useEffect(() => {
    if (!bumped) return;
    pop.value = withSequence(
      withTiming(1, { duration: 136, easing: SPRINGY }),
      withTiming(0, { duration: 204, easing: SPRINGY }),
    );
  }, [bumped, pop]);

  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(d.value, [0, 1], [C.white, C.doneRow]),
    transform: [
      { translateX: d.value * DONE_SHIFT },
      { translateY: d.value * DONE_SHIFT },
      { scale: 1 + pop.value * 0.32 },
      { rotate: `${pop.value * -7}deg` },
    ],
  }));

  const shadow = useAnimatedStyle(() => ({
    transform: [
      { translateX: d.value * DONE_SHADOW_SHIFT },
      { translateY: d.value * DONE_SHADOW_SHIFT },
    ],
  }));

  const check = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(d.value, [0, 1], [C.white, C.lime]),
  }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: SHADOW,
            top: SHADOW,
            right: -SHADOW,
            bottom: -SHADOW,
            borderRadius: RADIUS,
            backgroundColor: C.ink,
          },
          shadow,
        ]}
      />
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: BORDER,
            borderColor: C.ink,
            borderRadius: RADIUS,
            paddingVertical: 11,
            paddingHorizontal: 12,
          },
          box,
        ]}
      >
        <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: item.done }}>
          <Animated.View
            style={[
              {
                width: 30,
                height: 30,
                borderWidth: BORDER,
                borderColor: C.ink,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              },
              check,
            ]}
          >
            {item.done && <Text style={{ fontFamily: F.mono, fontSize: 15, color: C.ink }}>✓</Text>}
          </Animated.View>
        </Pressable>

        {editing ? (
          <TextInput
            value={editDraft}
            onChangeText={onChangeEdit}
            onSubmitEditing={onCommitEdit}
            onBlur={onCommitEdit}
            autoFocus
            returnKeyType="done"
            style={{
              flex: 1,
              minWidth: 0,
              padding: 0,
              fontFamily: F.semi,
              fontSize: 16,
              letterSpacing: ls(16, -0.02),
              color: C.ink,
              borderBottomWidth: 3,
              borderBottomColor: C.orange,
            }}
          />
        ) : (
          <Pressable onPress={onToggle} style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: F.semi,
                fontSize: 16,
                letterSpacing: ls(16, -0.02),
                color: item.done ? C.faint : C.ink,
                textDecorationLine: item.done ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onStartEdit}
          accessibilityLabel="이름 수정"
          hitSlop={6}
          style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 11, color: C.faint }}>✎</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          accessibilityLabel="삭제"
          hitSlop={6}
          style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: F.mono, fontSize: 14, color: C.faint }}>×</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
