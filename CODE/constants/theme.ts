// Native Sound — Design Tokens & Multi-Theme System
// Centralized theme constants and theme definitions supporting Default and BW themes.

export const Radii = {
  standard: 8,
  large: 12,
} as const;

export type ThemeMode = 'default' | 'bw';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  textPrimary: string;
  textMuted: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeRowBg: string;
  activeTint: string;
  cardIconBg: string;
  cardIconLikedBg: string;
}

export interface ThemeTypography {
  family: string;
  familyBold: string;
}

export interface Theme {
  name: ThemeMode;
  displayName: string;
  colors: ThemeColors;
  fonts: ThemeTypography;
  radii: typeof Radii;
}

export const DefaultTheme: Theme = {
  name: 'default',
  displayName: 'Classic',
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    surfaceSubtle: '#161616',
    border: '#2c2c2c',
    primary: '#0d6efd',    // Bootstrap Primary Blue
    danger: '#dc3545',     // Heart red
    success: '#198754',    // Bootstrap Success Green
    textPrimary: '#ffffff',
    textMuted: '#9e9e9e',
    iconColor: '#ffffff',
    badgeBg: 'rgba(13, 110, 253, 0.15)',
    badgeBorder: 'rgba(13, 110, 253, 0.3)',
    badgeText: '#0d6efd',
    activeRowBg: 'rgba(13, 110, 253, 0.15)',
    activeTint: 'rgba(13, 110, 253, 0.3)',
    cardIconBg: 'rgba(13, 110, 253, 0.15)',
    cardIconLikedBg: 'rgba(220, 53, 69, 0.15)',
  },
  fonts: {
    family: 'Inter',
    familyBold: 'Inter-Bold',
  },
  radii: Radii,
};

export const BWTheme: Theme = {
  name: 'bw',
  displayName: 'B&W',
  colors: {
    background: '#0a0a0a',
    surface: '#161616',
    surfaceSubtle: '#121212',
    border: '#2a2a2a',
    primary: '#ffffff',    // Pure monochrome white
    danger: '#ffffff',     // Monochrome white for hearts/accents
    success: '#ffffff',
    textPrimary: '#ffffff',
    textMuted: '#8a8a8a',
    iconColor: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
    badgeBorder: 'rgba(255, 255, 255, 0.25)',
    badgeText: '#ffffff',
    activeRowBg: 'rgba(255, 255, 255, 0.12)',
    activeTint: 'rgba(255, 255, 255, 0.25)',
    cardIconBg: 'rgba(255, 255, 255, 0.12)',
    cardIconLikedBg: 'rgba(255, 255, 255, 0.12)',
  },
  fonts: {
    family: 'A Box For',
    familyBold: 'A Box For',
  },
  radii: Radii,
};

export const Themes: Record<ThemeMode, Theme> = {
  default: DefaultTheme,
  bw: BWTheme,
};

// Legacy fallback tokens for components not yet migrated to useTheme()
export const Colors = DefaultTheme.colors;
export const Fonts = DefaultTheme.fonts;

export default { Colors, Radii, Fonts, DefaultTheme, BWTheme, Themes };
