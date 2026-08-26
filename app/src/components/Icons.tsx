import React from 'react';
import Svg, { Path } from 'react-native-svg';

/** Paths lifted verbatim from the prototype's inline SVG. */

type P = { size: number; color: string };

const stroke = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** Floppy disk — "저장". */
export const SaveIcon = ({ size, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M5.5 4.5h9.6l4.4 4.4v9.6a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-12.5A1.5 1.5 0 0 1 5.5 4.5z"
      stroke={color}
      strokeWidth={2.1}
      {...stroke}
    />
    <Path d="M8.4 4.5v5h6.2v-5" stroke={color} strokeWidth={2.1} {...stroke} />
    <Path d="M8.4 19.5v-5.4h7.2v5.4" stroke={color} strokeWidth={2.1} {...stroke} />
  </Svg>
);

/** Stacked notebooks — the centre button that raises 최근 체크리스트. */
export const NotebookIcon = ({ size, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M8.4 6.6h9.1a2 2 0 0 1 2 2v10.4a2 2 0 0 1-2 2H8.4a2 2 0 0 1-2-2V8.6a2 2 0 0 1 2-2z"
      stroke={color}
      strokeWidth={2.1}
      {...stroke}
    />
    <Path
      d="M4.4 16.6a2 2 0 0 1-1.1-1.8V5.4a2 2 0 0 1 2-2h8.5a2 2 0 0 1 1.8 1.1"
      stroke={color}
      strokeWidth={2.1}
      {...stroke}
    />
    <Path d="M9.8 11.4h6.3M9.8 14.6h6.3M9.8 17.6h3.6" stroke={color} strokeWidth={2.1} {...stroke} />
  </Svg>
);

/** Double check — "전부". */
export const CheckAllIcon = ({ size, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M3 12.8l3.4 3.4L13 9" stroke={color} strokeWidth={2.2} {...stroke} />
    <Path d="M10.6 15.4l1.6 1.6L21 8.2" stroke={color} strokeWidth={2.2} {...stroke} />
  </Svg>
);
