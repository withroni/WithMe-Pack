import { Easing } from 'react-native-reanimated';

/** The prototype's cubic-beziers, kept by name so the intent survives the port. */
export const SPRINGY = Easing.bezier(0.34, 1.56, 0.64, 1); // pops, chips, dock centre
export const SHEET = Easing.bezier(0.3, 1.25, 0.5, 1); // bottom sheet travel
export const SOFT_SPRING = Easing.bezier(0.34, 1.4, 0.64, 1); // progress bar, rise, toast
export const EASE = Easing.out(Easing.quad);
