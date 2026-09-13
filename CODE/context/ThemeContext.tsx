// Native Sound — Theme Context (context/ThemeContext.tsx)
// Provides dynamic theme management, instant reactive styling, and SQLite persistence.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Theme,
  type ThemeMode,
  type ThemeColors,
  type ThemeTypography,
  DefaultTheme,
  BWTheme,
  Themes,
} from '../constants/theme';
import { getSetting, setSetting } from '../services/database';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  fonts: ThemeTypography;
  isBW: boolean;
  isCustom: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setMode] = useState<ThemeMode>('default');
  const userChangedRef = React.useRef(false);

  // Load saved theme preference on app start
  useEffect(() => {
    let cancelled = false;
    getSetting('theme', 'default')
      .then((savedMode) => {
        if (
          !cancelled &&
          !userChangedRef.current &&
          (savedMode === 'default' || savedMode === 'bw' || savedMode === 'custom')
        ) {
          setMode(savedMode as ThemeMode);
        }
      })
      .catch((err) => console.warn('[ThemeContext] Error loading theme setting:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    userChangedRef.current = true;
    setMode(mode);
    try {
      await setSetting('theme', mode);
    } catch (err) {
      console.warn('[ThemeContext] Failed to persist theme:', err);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    userChangedRef.current = true;
    setMode((prev) => {
      let next: ThemeMode = 'default';
      if (prev === 'default') next = 'bw';
      else if (prev === 'bw') next = 'custom';
      else next = 'default';
      setSetting('theme', next).catch((err) =>
        console.warn('[ThemeContext] Failed to persist theme:', err)
      );
      return next;
    });
  }, []);

  const activeTheme = useMemo(() => Themes[themeMode] ?? DefaultTheme, [themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: activeTheme,
      themeMode,
      colors: activeTheme.colors,
      fonts: activeTheme.fonts,
      isBW: themeMode === 'bw' || themeMode === 'custom',
      isCustom: themeMode === 'custom',
      setThemeMode,
      toggleTheme,
    }),
    [activeTheme, themeMode, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback gracefully to DefaultTheme if used outside ThemeProvider
    return {
      theme: DefaultTheme,
      themeMode: 'default',
      colors: DefaultTheme.colors,
      fonts: DefaultTheme.fonts,
      isBW: false,
      isCustom: false,
      setThemeMode: async () => {},
      toggleTheme: async () => {},
    };
  }
  return ctx;
}

export default ThemeContext;
