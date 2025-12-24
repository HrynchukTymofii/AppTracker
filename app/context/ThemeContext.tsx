import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

// Accent color definitions
export type AccentColorName = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo';

export interface AccentColor {
  name: AccentColorName;
  label: string;
  primary: string;
  dark: string;
  light: string;
  rgb: string; // For rgba usage
}

export const ACCENT_COLORS: Record<AccentColorName, AccentColor> = {
  blue: {
    name: 'blue',
    label: 'Ocean Blue',
    primary: '#3b82f6',
    dark: '#1d4ed8',
    light: 'rgba(59, 130, 246, 0.1)',
    rgb: '59, 130, 246',
  },
  purple: {
    name: 'purple',
    label: 'Royal Purple',
    primary: '#8b5cf6',
    dark: '#6d28d9',
    light: 'rgba(139, 92, 246, 0.1)',
    rgb: '139, 92, 246',
  },
  green: {
    name: 'green',
    label: 'Emerald',
    primary: '#10b981',
    dark: '#059669',
    light: 'rgba(16, 185, 129, 0.1)',
    rgb: '16, 185, 129',
  },
  orange: {
    name: 'orange',
    label: 'Sunset',
    primary: '#f59e0b',
    dark: '#d97706',
    light: 'rgba(245, 158, 11, 0.1)',
    rgb: '245, 158, 11',
  },
  pink: {
    name: 'pink',
    label: 'Rose',
    primary: '#ec4899',
    dark: '#db2777',
    light: 'rgba(236, 72, 153, 0.1)',
    rgb: '236, 72, 153',
  },
  red: {
    name: 'red',
    label: 'Ruby',
    primary: '#ef4444',
    dark: '#dc2626',
    light: 'rgba(239, 68, 68, 0.1)',
    rgb: '239, 68, 68',
  },
  teal: {
    name: 'teal',
    label: 'Teal',
    primary: '#14b8a6',
    dark: '#0d9488',
    light: 'rgba(20, 184, 166, 0.1)',
    rgb: '20, 184, 166',
  },
  indigo: {
    name: 'indigo',
    label: 'Indigo',
    primary: '#6366f1',
    dark: '#4f46e5',
    light: 'rgba(99, 102, 241, 0.1)',
    rgb: '99, 102, 241',
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  // Accent color
  accentColor: AccentColor;
  accentColorName: AccentColorName;
  setAccentColor: (color: AccentColorName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';
const ACCENT_COLOR_STORAGE_KEY = '@app_accent_color';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentColorName, setAccentColorName] = useState<AccentColorName>('blue');

  // Load theme and accent color preference from storage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [storedTheme, storedAccent] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_COLOR_STORAGE_KEY),
        ]);

        if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')) {
          setThemeModeState(storedTheme as ThemeMode);
        }

        if (storedAccent && storedAccent in ACCENT_COLORS) {
          setAccentColorName(storedAccent as AccentColorName);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Calculate the actual color scheme based on preference and system theme
  const colorScheme: ColorScheme =
    themeMode === 'system'
      ? (systemColorScheme || 'light')
      : themeMode;

  // Function to update theme and persist to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Function to update accent color and persist to storage
  const setAccentColor = async (color: AccentColorName) => {
    try {
      setAccentColorName(color);
      await AsyncStorage.setItem(ACCENT_COLOR_STORAGE_KEY, color);
    } catch (error) {
      console.error('Failed to save accent color preference:', error);
    }
  };

  const accentColor = ACCENT_COLORS[accentColorName];

  return (
    <ThemeContext.Provider value={{
      themeMode,
      colorScheme,
      setThemeMode,
      accentColor,
      accentColorName,
      setAccentColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook to get colors based on current theme
export function useThemeColors() {
  const { accentColor, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return {
    primary: accentColor.primary,
    primaryDark: accentColor.dark,
    primaryLight: accentColor.light,
    primaryRgb: accentColor.rgb,
    isDark,
    // Common colors
    background: isDark ? '#000000' : '#f8fafc',
    card: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
  };
}
