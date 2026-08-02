// Native Sound — Design Tokens
// Centralized theme constants for the "True Dark" design system.

export const Colors = {
  background: '#121212',
  surface: '#1e1e1e',
  border: '#2c2c2c',
  primary: '#0d6efd',    // Bootstrap Primary Blue
  danger: '#dc3545',     // Liked / heart red
  textPrimary: '#ffffff',
  textMuted: '#9e9e9e',
  success: '#198754',    // Bootstrap Success Green
} as const;

export const Radii = {
  standard: 8,
  large: 12,
} as const;

export const Fonts = {
  family: 'Inter',
  familyBold: 'Inter-Bold',
} as const;

export default { Colors, Radii, Fonts };
