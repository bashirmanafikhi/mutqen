// src/context/AppSettingsContext.tsx

import i18n from '@/services/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// ----------------------------------------------------------------------
// 🎚️ CONFIGURATION & TYPES
// ----------------------------------------------------------------------

// Tailwind classes mapping for font sizes
export const FONT_SIZES = {
    small: "text-app-sm",
    medium: "text-app-md",
    large: "text-app-lg",
    xlarge: "text-app-xl",
} as const;
export type FontSizeKey = keyof typeof FONT_SIZES;

// Theme Modes
export type ThemeMode = 'light' | 'dark' | 'phone';

// Supported Languages (including 'phone' for device default)
export type LanguageCode = 'ar' | 'en' | 'phone';
export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string }[] = [
    { code: 'phone', label: 'Phone Default' },
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
];

// Context Interface
interface AppSettingsContextProps {
    theme: ColorSchemeName;
    isDark: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;

    fontSizeKey: FontSizeKey;
    fontSizeClass: string;
    setFontSizeKey: (key: FontSizeKey) => void;

    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
}

// ----------------------------------------------------------------------
// 📦 STORAGE & UTILITIES
// ----------------------------------------------------------------------

// AsyncStorage Keys
const THEME_MODE_STORAGE_KEY = 'user_preferred_theme_mode';
const FONT_STORAGE_KEY = 'user_preferred_font_size';
const LANGUAGE_STORAGE_KEY = 'user_preferred_language';

// Get device language code (simplified logic)
const getDeviceLanguage = (): 'ar' | 'en' => {
    try {
        const locales = getLocales();
        const deviceLang = locales?.[0]?.languageCode?.toLowerCase();
        // Only explicitly support 'ar', default to 'en' otherwise
        return deviceLang === 'ar' ? 'ar' : 'en';
    } catch {
        return 'en';
    }
};

// ----------------------------------------------------------------------
// ⚙️ CONTEXT & PROVIDER
// ----------------------------------------------------------------------

const AppSettingsContext = createContext<AppSettingsContextProps | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
    const [themeMode, setThemeModeState] = useState<ThemeMode>('phone');
    const [fontSizeKey, setFontSizeKeyState] = useState<FontSizeKey>('medium');
    const [language, setLanguageState] = useState<LanguageCode>('phone'); // Default to 'phone'

    const isDark = theme === 'dark';
    const fontSizeClass = FONT_SIZES[fontSizeKey];
    
    // Helper function to resolve the actual language code (e.g., 'ar' or 'en') from the stored preference ('ar', 'en', or 'phone')
    const resolveActualLanguage = (preferred: LanguageCode): 'ar' | 'en' => {
        return preferred === 'phone' ? getDeviceLanguage() : preferred;
    };

    // -------------------
    // Handlers (Setters)
    // -------------------

    const setLanguage = useCallback(async (lang: LanguageCode) => {
        setLanguageState(lang);
        const actualLang = resolveActualLanguage(lang);
        
        try {
            await i18n.changeLanguage(actualLang);
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (e) {
            console.error('Failed to set language:', e);
        }
    }, []);

    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        setThemeModeState(mode);
        const newTheme = mode === 'phone' ? Appearance.getColorScheme() || 'light' : mode;

        try {
            setTheme(newTheme);
            await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
        } catch (e) {
            console.error('Failed to set theme mode:', e);
        }
    }, []);

    const setFontSizeKey = useCallback(async (key: FontSizeKey) => {
        if (!FONT_SIZES[key]) return; // Guard against invalid key
        setFontSizeKeyState(key);
        try {
            await AsyncStorage.setItem(FONT_STORAGE_KEY, key);
        } catch (e) {
            console.error('Failed to save font size:', e);
        }
    }, []);


    // -------------------
    // 💾 Initialization & Data Loading
    // -------------------
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // 1. Load Stored Settings
                const storedLang = (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) as LanguageCode || 'phone';
                const storedThemeMode = (await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)) as ThemeMode || 'phone';
                const storedFontKey = (await AsyncStorage.getItem(FONT_STORAGE_KEY)) as FontSizeKey || 'medium';

                // 2. Apply Theme Mode
                setThemeModeState(storedThemeMode);
                const actualTheme = storedThemeMode === 'phone' ? Appearance.getColorScheme() || 'light' : storedThemeMode;
                setTheme(actualTheme);

                // 3. Apply Language
                setLanguageState(storedLang);
                const actualLang = resolveActualLanguage(storedLang);
                await i18n.changeLanguage(actualLang);

                // 4. Apply Font Size
                if (FONT_SIZES[storedFontKey]) {
                    setFontSizeKeyState(storedFontKey);
                }
                
            } catch (e) {
                console.error('Failed to load initial app settings:', e);
            }
        };
        loadSettings();
    }, [i18n.changeLanguage]); // Dependency to ensure i18n is configured

    // -------------------
    // 🔄 Live Theme Listener
    // -------------------
    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            // Only update the theme state if the user's preference is 'phone'
            if (themeMode === 'phone') {
                setTheme(colorScheme || 'light');
            }
        });
        return () => sub.remove();
    }, [themeMode]);


    // -------------------
    // Provider Value
    // -------------------
    const contextValue: AppSettingsContextProps = {
        theme,
        isDark,
        themeMode,
        setThemeMode,
        fontSizeKey,
        fontSizeClass,
        setFontSizeKey,
        language,
        setLanguage,
    };

    return (
        <AppSettingsContext.Provider value={contextValue}>
            {children}
        </AppSettingsContext.Provider>
    );
};

// ----------------------------------------------------------------------
// 🎣 Custom Hook
// ----------------------------------------------------------------------
export const useSettings = () => {
    const context = useContext(AppSettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within an AppSettingsProvider');
    }
    return context;
};