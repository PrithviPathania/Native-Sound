// Native Sound — Bootstrap Utility Styles Engine
// Robust, high-performance design system implementing Bootstrap utility classes.
// Replaces obsolete native package imports to prevent runtime crashes while
// providing full support for s and c utility objects across all screens.

import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { Colors, Radii } from '../constants/theme';

export const c = {
  primary: Colors.primary,
  danger: Colors.danger,
  success: Colors.success,
  dark: Colors.background,
  light: Colors.textPrimary,
  secondary: Colors.textMuted,
  border: Colors.border,
  surface: Colors.surface,
};

const staticStyles = StyleSheet.create({
  // Flex utilities
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  alignItemsCenter: { alignItems: 'center' },
  alignSelfCenter: { alignSelf: 'center' },
  justifyContentCenter: { justifyContent: 'center' },
  justifyContentBetween: { justifyContent: 'space-between' },
  justifyContentAround: { justifyContent: 'space-around' },

  // Padding utilities
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 16 },
  p4: { padding: 24 },
  px1: { paddingHorizontal: 4 },
  px2: { paddingHorizontal: 8 },
  px3: { paddingHorizontal: 16 },
  px4: { paddingHorizontal: 24 },
  py1: { paddingVertical: 4 },
  py2: { paddingVertical: 8 },
  py3: { paddingVertical: 16 },
  py4: { paddingVertical: 24 },
  pb4: { paddingBottom: 24 },

  // Margin utilities
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 16 },
  mb4: { marginBottom: 24 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 16 },
  mt4: { marginTop: 24 },

  // Border Radius
  rounded: { borderRadius: Radii.standard },         // 8px
  roundedLg: { borderRadius: Radii.large },         // 12px
  roundedCircle: { borderRadius: 9999 },
  roundedPill: { borderRadius: 50 },

  // Colors & Backgrounds
  bgDark: { backgroundColor: Colors.background },
  bgSurface: { backgroundColor: Colors.surface },
  bgPrimary: { backgroundColor: Colors.primary },
  textWhite: { color: Colors.textPrimary },
  textSecondary: { color: Colors.textMuted },
  textPrimary: { color: Colors.primary },
  textDanger: { color: Colors.danger },
  textSuccess: { color: Colors.success },

  // Sizing & Card
  w100: { width: '100%' },
  h100: { height: '100%' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.standard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

// Proxy fallback ensures accessing any utility property safely returns a style object.
export const s = new Proxy(staticStyles as Record<string, ViewStyle | TextStyle | ImageStyle>, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    return {};
  },
});

export default { s, c };
