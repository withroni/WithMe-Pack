/**
 * Design tokens ported from `Packing Checklist v2 (바텀시트).dc.html`.
 *
 * The prototype expressed everything as inline CSS on a 390×844 artboard.
 * Numbers here are the literal values from that file — resist "rounding them
 * nicer", the sticker look depends on the 2.5px borders and half-pixel sizes.
 */

export const C = {
  ink: '#17140F',
  paper: '#FFFBF3',
  sand: '#FFE0AE',
  cream: '#FFF3D6',
  white: '#FFFFFF',
  orange: '#FF5A1F',
  lime: '#C6F24A',
  blue: '#2F4BFF',
  pink: '#FFC2D1',
  sky: '#9EC9FF',
  amber: '#FFB020',
  muted: '#6B6255',
  faint: '#A79C8B',
  doneRow: '#F1F7DE',
  offBg: '#EDE6D8',
  dim: 'rgba(23,20,15,0.4)',
} as const;

/**
 * Only the weights the design actually reaches for — Pretendard covers the full
 * Hangul syllable range, so every unused weight is ~2.7MB of dead bundle.
 */
export const F = {
  reg: 'Pretendard-Regular',
  semi: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  xbold: 'Pretendard-ExtraBold',
  mono: 'SpaceGrotesk_700Bold',
} as const;

/** CSS `letter-spacing` is in em; React Native wants px. */
export const ls = (size: number, em: number) => size * em;

export const BORDER = 2.5;
