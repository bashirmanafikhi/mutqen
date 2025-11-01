// src/context/AppSettingsContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// -------------------
// Font Size Config (Tailwind classes)
// -------------------
export const FONT_SIZES = {
  small: "text-app-sm",
  medium: "text-app-md",
  large: "text-app-lg",
  xlarge: "text-app-xl",
} as const;
export type FontSizeKey = keyof typeof FONT_SIZES;

// -------------------
// Context Interface
// -------------------
interface AppSettingsContextProps {
  theme: ColorSchemeName;
  isDark: boolean;
  toggleTheme: () => void;

  fontSizeKey: FontSizeKey;
  fontSizeClass: string; // Tailwind class for text size
  setFontSizeKey: (key: FontSizeKey) => void;
}

// -------------------
// AsyncStorage Keys
// -------------------
const THEME_STORAGE_KEY = 'user_preferred_theme';
const FONT_STORAGE_KEY = 'user_preferred_font_size';

// -------------------
// Context & Provider
// -------------------
const AppSettingsContext = createContext<AppSettingsContextProps | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [fontSizeKey, setFontSizeKeyState] = useState<FontSizeKey>('medium');

  const isDark = theme === 'dark';
  const fontSizeClass = FONT_SIZES[fontSizeKey];

  // -------------------
  // Load Theme & Font from Storage
  // -------------------
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = (await AsyncStorage.getItem(THEME_STORAGE_KEY)) as ColorSchemeName | null;
        if (storedTheme) setTheme(storedTheme);

        const storedFont = (await AsyncStorage.getItem(FONT_STORAGE_KEY)) as FontSizeKey | null;
        if (storedFont && FONT_SIZES[storedFont]) setFontSizeKeyState(storedFont);
      } catch (e) {
        console.error('Failed to load app settings:', e);
      }
    };
    loadSettings();
  }, []);

  // -------------------
  // Handlers
  // -------------------
  const toggleTheme = async () => {
    const newTheme: ColorSchemeName = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  const setFontSizeKey = async (key: FontSizeKey) => {
    setFontSizeKeyState(key);
    try {
      await AsyncStorage.setItem(FONT_STORAGE_KEY, key);
    } catch (e) {
      console.error('Failed to save font size:', e);
    }
  };

  // -------------------
  // Provider
  // -------------------
  return (
    <AppSettingsContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        fontSizeKey,
        fontSizeClass,
        setFontSizeKey,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

// -------------------
// Custom Hook
// -------------------
export const useSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useSettings must be used within an AppSettingsProvider');
  return context;
};
