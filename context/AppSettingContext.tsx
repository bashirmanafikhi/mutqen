// src/context/ThemeContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Define the shape of the context data
interface ThemeContextProps {
    theme: ColorSchemeName;
    isDark: boolean;
    toggleTheme: () => void;
}

// --- Font Size Configuration ---
export const FONT_SIZES = {
    small: 14,
    medium: 16,
    large: 18,
};
export type FontSizeKey = keyof typeof FONT_SIZES;

interface AppSettingsContextProps {
    theme: ColorSchemeName;
    isDark: boolean;
    toggleTheme: () => void;
    // --- NEW: Font Size Properties ---
    fontSize: number;
    fontSizeKey: FontSizeKey;
    setFontSizeKey: (key: FontSizeKey) => void;
}
const AppSettingsContext = createContext<AppSettingsContextProps | undefined>(undefined);
const FONT_STORAGE_KEY = 'user_preferred_font_size';
const THEME_STORAGE_KEY = 'user_preferred_theme';

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());


    const [fontSizeKey, setFontSizeKey] = useState<FontSizeKey>('medium');
    const fontSize = FONT_SIZES[fontSizeKey];

    // --- Font Size Persistence Logic ---
    useEffect(() => {
        const loadFontSize = async () => {
            try {
                const storedKey = await AsyncStorage.getItem(FONT_STORAGE_KEY) as FontSizeKey;
                if (storedKey && FONT_SIZES[storedKey]) {
                    setFontSizeKey(storedKey);
                }
            } catch (e) {
                console.error("Failed to load font size:", e);
            }
        };
        loadFontSize();
    }, []);

    const handleSetFontSizeKey = async (key: FontSizeKey) => {
        setFontSizeKey(key);
        await AsyncStorage.setItem(FONT_STORAGE_KEY, key);
    };

    // --- Theme Persistence Logic ---
    useEffect(() => {
        // 1. Load preference from storage
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ColorSchemeName;
                if (storedTheme) {
                    setTheme(storedTheme);
                } else {
                    // Fallback to system if nothing stored
                    setTheme(Appearance.getColorScheme());
                }
            } catch (e) {
                console.error("Failed to load theme:", e);
            }
        };

        loadTheme();

        // 2. Listen for system changes (if user hasn't set a preference)
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            // Only update if the user hasn't explicitly set a preference (optional logic)
            // For simplicity, we usually let the user preference override the system.
        });

        return () => subscription.remove();
    }, []);

    const isDark = theme === 'dark';

    // --- Toggle Function ---
    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        setTheme(newTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

return (
        <AppSettingsContext.Provider value={{ 
            theme, 
            isDark, 
            toggleTheme,
            fontSize, 
            fontSizeKey, 
            setFontSizeKey: handleSetFontSizeKey 
        }}>
            {children}
        </AppSettingsContext.Provider>
    );
};

// Custom hook to use the app settings context
export const useSettings = () => {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within an AppSettingsProvider');
    }
    return context;
};