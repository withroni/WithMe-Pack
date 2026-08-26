import React, { useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { BORDER, C } from '../theme';

/**
 * `border: 2.5px dashed` with a large border-radius renders inconsistently in
 * React Native (Android in particular collapses it to a solid stroke), so the
 * dashed outline is drawn with SVG instead. Layout still comes from the View.
 *
 * Note for children: the outline is an absolutely-positioned sibling. Native
 * paints strictly in child order so it stays behind, but under react-native-web
 * a *statically* positioned child (a bare `TextInput`) would paint beneath it —
 * give any such child `position: 'relative'`.
 */
export function DashedBox({
  radius,
  fill = C.cream,
  stroke = C.ink,
  width = BORDER,
  style,
  children,
}: {
  radius: number;
  fill?: string;
  stroke?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== size.w || h !== size.h) setSize({ w, h });
  };

  return (
    <View onLayout={onLayout} style={style}>
      {size.w > 0 && size.h > 0 && (
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={size.w} height={size.h}>
          <Rect
            x={width / 2}
            y={width / 2}
            width={Math.max(0, size.w - width)}
            height={Math.max(0, size.h - width)}
            rx={Math.max(0, radius - width / 2)}
            ry={Math.max(0, radius - width / 2)}
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray="7 5"
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
