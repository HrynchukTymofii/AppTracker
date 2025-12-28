'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ACCENT_COLORS, THEME, AccentColorName, AccentColor } from '@/lib/constants';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  accentColorName: AccentColorName;
  setAccentColor: (color: AccentColorName) => void;
  colors: typeof THEME.dark;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'lockin_theme_preference';
const ACCENT_STORAGE_KEY = 'lockin_accent_color';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [accentColorName, setAccentColorName] = useState<AccentColorName>('blue');
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);

    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')) {
      setThemeModeState(storedTheme as ThemeMode);
    }

    if (storedAccent && storedAccent in ACCENT_COLORS) {
      setAccentColorName(storedAccent as AccentColorName);
    }
  }, []);

  // Get system preference
  const getSystemTheme = (): ColorScheme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  // Calculate effective color scheme
  const colorScheme: ColorScheme =
    themeMode === 'system' ? getSystemTheme() : themeMode;

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (colorScheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorScheme, mounted]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setAccentColor = (color: AccentColorName) => {
    setAccentColorName(color);
    localStorage.setItem(ACCENT_STORAGE_KEY, color);
  };

  const accentColor = ACCENT_COLORS[accentColorName];
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colorScheme,
        setThemeMode,
        accentColor,
        accentColorName,
        setAccentColor,
        colors,
      }}
    >
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
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
