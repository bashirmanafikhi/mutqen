// src/screens/SettingsScreen.tsx

import { FONT_SIZES, FontSizeKey, useSettings } from '@/context/AppSettingContext';
import { Stack } from 'expo-router';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { isDark, toggleTheme, fontSizeKey, setFontSizeKey, fontSizeClass } = useSettings();

  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <View className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Stack.Screen options={{ title: 'الإعدادات' }} />

      <Text className={`text-2xl font-bold mb-6 ${textColor}`}>
        ⚙️ إعدادات التطبيق
      </Text>

      {/* Dark Mode */}
      <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
        <Text className={`text-lg ${subtextColor}`}>الوضع الداكن (Dark Mode)</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#6366f1' }}
          thumbColor="#f4f3f4"
          onValueChange={toggleTheme}
          value={isDark}
        />
      </View>

      {/* Font Size */}
      <View className={`p-4 border-b ${borderColor}`}>
        <Text className={`text-lg mb-2 ${subtextColor}`}>حجم الخط (Font Size)</Text>
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

      {/* Placeholder for additional settings */}
      <TouchableOpacity className={`p-4 border-b ${borderColor}`}>
        <Text className={`text-lg ${subtextColor}`}>إعدادات إضافية قريباً...</Text>
      </TouchableOpacity>
    </View>
  );
}
