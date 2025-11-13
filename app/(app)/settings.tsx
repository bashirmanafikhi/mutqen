// src/screens/SettingsScreen.tsx

import { FONT_SIZES, FontSizeKey, SUPPORTED_LANGUAGES, ThemeMode, useSettings } from '@/context/AppSettingContext';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { isDark, fontSizeKey, setFontSizeKey, fontSizeClass, language, setLanguage, themeMode, setThemeMode } = useSettings();
  const { t } = useTranslation();

  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <View className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Stack.Screen options={{ title: t('settings.title') }} />

      {/* Language Selection */}
      <View className={`p-4 border-b ${borderColor}`}>
        <Text className={`text-lg mb-3 ${subtextColor}`}>{t('settings.language')}</Text>
        <View className="flex-row justify-around mt-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              className={`px-4 py-2 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${language === lang.code ? 'bg-indigo-500' : ''}`}
            >
              <Text className={`text-sm font-semibold ${language === lang.code ? 'text-white' : subtextColor}`}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Mode Selection */}
      <View className={`p-4 border-b ${borderColor}`}>
        <Text className={`text-lg mb-3 ${subtextColor}`}>{t('settings.theme_mode')}</Text>
        <View className="flex-row justify-around mt-2">
          {(['phone', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setThemeMode(mode)}
              className={`px-4 py-2 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${themeMode === mode ? 'bg-indigo-500' : ''}`}
            >
              <Text className={`text-sm font-semibold ${themeMode === mode ? 'text-white' : subtextColor}`}>
                {t(`settings.${mode}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Font Size */}
      <View className={`p-4 border-b ${borderColor}`}>
        <Text className={`text-lg mb-2 ${subtextColor}`}>{t('settings.font_size')}</Text>
        <View className="flex-row justify-around mt-2">
          {Object.keys(FONT_SIZES).map((key) => {
            const sizeKey = key as FontSizeKey;
            const isSelected = sizeKey === fontSizeKey;
            return (
              <TouchableOpacity
                key={sizeKey}
                onPress={() => setFontSizeKey(sizeKey)}
                className={`px-4 py-2 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${isSelected ? 'bg-indigo-500' : ''}`}
              >
                <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : subtextColor}`}>
                  {sizeKey.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
