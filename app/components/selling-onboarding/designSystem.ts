// ============================================
// DESIGN SYSTEM - Light/Dark Theme Support
// ============================================

import { createContext, useContext } from 'react';

// Gradient colors (shared between themes)
export const GRADIENT_PALETTE = {
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  orange: '#F97316',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// Theme-specific colors
export const DARK_COLORS = {
  // Base
  background: '#000000',
  surface: '#0a0a0a',

  // Glass effects
  glassLight: 'rgba(255, 255, 255, 0.08)',
  glassMedium: 'rgba(255, 255, 255, 0.12)',
  glassHeavy: 'rgba(255, 255, 255, 0.18)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',

  // Progress bar background
  progressBg: 'rgba(255, 255, 255, 0.08)',
};

export const LIGHT_COLORS = {
  // Base
  background: '#ffffff',
  surface: '#f8fafc',

  // Glass effects
  glassLight: 'rgba(0, 0, 0, 0.04)',
  glassMedium: 'rgba(0, 0, 0, 0.06)',
  glassHeavy: 'rgba(0, 0, 0, 0.10)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',

  // Text
  textPrimary: '#0f172a',
  textSecondary: 'rgba(15, 23, 42, 0.7)',
  textTertiary: 'rgba(15, 23, 42, 0.4)',

  // Progress bar background
  progressBg: 'rgba(0, 0, 0, 0.08)',
};

// Helper to get theme colors
export const getThemeColors = (isDark: boolean) => isDark ? DARK_COLORS : LIGHT_COLORS;

// Legacy COLORS object for backward compatibility (dark theme)
export const COLORS = {
  // Base
  black: '#000000',
  white: '#FFFFFF',

  // Gradients
  gradientPurple: GRADIENT_PALETTE.purple,
  gradientBlue: GRADIENT_PALETTE.blue,
  gradientCyan: GRADIENT_PALETTE.cyan,
  gradientPink: GRADIENT_PALETTE.pink,
  gradientOrange: GRADIENT_PALETTE.orange,

  // Glass (dark theme)
  glassLight: DARK_COLORS.glassLight,
  glassMedium: DARK_COLORS.glassMedium,
  glassHeavy: DARK_COLORS.glassHeavy,
  glassBorder: DARK_COLORS.glassBorder,

  // Text (dark theme)
  textPrimary: DARK_COLORS.textPrimary,
  textSecondary: DARK_COLORS.textSecondary,
  textTertiary: DARK_COLORS.textTertiary,

  // Status
  success: GRADIENT_PALETTE.success,
  error: GRADIENT_PALETTE.error,
  warning: GRADIENT_PALETTE.warning,
};

export type GradientTuple = [string, string, ...string[]];

export const GRADIENT_COLORS: Record<string, GradientTuple> = {
  primary: [GRADIENT_PALETTE.purple, GRADIENT_PALETTE.cyan],
  accent: [GRADIENT_PALETTE.purple, GRADIENT_PALETTE.blue, GRADIENT_PALETTE.cyan],
  warm: [GRADIENT_PALETTE.pink, GRADIENT_PALETTE.orange],
  success: [GRADIENT_PALETTE.success, GRADIENT_PALETTE.cyan],
  danger: [GRADIENT_PALETTE.error, GRADIENT_PALETTE.orange],
};

// Theme types
export type ThemeColors = typeof DARK_COLORS;

export interface OnboardingTheme {
  isDark: boolean;
  colors: ThemeColors;
}

// Theme context
export const OnboardingThemeContext = createContext<OnboardingTheme>({
  isDark: true,
  colors: DARK_COLORS,
});

export const useOnboardingTheme = () => useContext(OnboardingThemeContext);
