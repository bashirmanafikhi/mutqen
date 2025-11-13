import { FONT_SIZES, FontSizeKey, SUPPORTED_LANGUAGES, ThemeMode, useSettings } from '@/context/AppSettingContext';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const {
    isDark,
    fontSizeKey,
    setFontSizeKey,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
  } = useSettings();
  const { t } = useTranslation();
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Stack.Screen options={{ title: t('settings.title') }} />

      {/* Language Selection */}
      <Section title={t('settings.language')} borderColor={borderColor}>
        <View className="flex-row justify-around mt-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <OptionButton
              key={lang.code}
              label={lang.label}
              selected={language === lang.code}
              onPress={() => setLanguage(lang.code)}
              isDark={isDark}
            />
          ))}
        </View>
      </Section>

      {/* Theme Mode Selection */}
      <Section title={t('settings.theme_mode')} borderColor={borderColor}>
        <View className="flex-row justify-around mt-2">
          {(['phone', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <OptionButton
              key={mode}
              label={t(`settings.${mode}`)}
              selected={themeMode === mode}
              onPress={() => setThemeMode(mode)}
              isDark={isDark}
            />
          ))}
        </View>
      </Section>

      {/* Font Size Selection */}
      <Section title={t('settings.font_size')} borderColor={borderColor}>
        <View className="flex-row justify-around mt-2">
          {Object.keys(FONT_SIZES).map((key) => {
            const sizeKey = key as FontSizeKey;
            return (
              <OptionButton
                key={sizeKey}
                label={sizeKey.toUpperCase()}
                selected={fontSizeKey === sizeKey}
                onPress={() => setFontSizeKey(sizeKey)}
                isDark={isDark}
              />
            );
          })}
        </View>
      </Section>
    </ScrollView>
  );
}

// ----------------------------------------------------------------------
// 🧱 Helper Components
// ----------------------------------------------------------------------

function Section({
  title,
  children,
  borderColor,
}: {
  title: string;
  children: React.ReactNode;
  borderColor: string;
}) {
  return (
    <View className={`p-4 border-b ${borderColor}`}>
      <Text className="text-lg font-semibold mb-3 text-indigo-500">{title}</Text>
      {children}
    </View>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
  isDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        isDark ? 'border-gray-600' : 'border-gray-300'
      } ${selected ? 'bg-indigo-500' : ''}`}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
