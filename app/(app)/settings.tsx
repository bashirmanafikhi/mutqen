// app/(app)/settings.tsx (Updated for clarity and Tailwind compatibility)

import { FONT_SIZES, FontSizeKey, useSettings } from '@/context/AppSettingContext';
import { Stack } from 'expo-router';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {

    const { isDark, toggleTheme, fontSizeKey, setFontSizeKey } = useSettings();
    // Helper class for text color based on theme
    const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
    const subtextColor = isDark ? 'text-gray-300' : 'text-gray-700';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    return (
        // 1. Apply Conditional BG Class to the outermost View
        <View style={{ flex: 1 }} className={`p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <Stack.Screen options={{ title: "الإعدادات" }} />

            <Text className={`text-2xl font-bold mb-6 ${textColor}`}>
                ⚙️ إعدادات التطبيق
            </Text>

            {/* Dark Mode Option */}
            <View className={`flex-row justify-between items-center p-4 border-b ${borderColor}`}>
                <Text className={`text-lg ${subtextColor}`}>
                    الوضع الداكن (Dark Mode)
                </Text>
                <Switch
                    // NOTE: Use conditional colors for trackColor if necessary
                    trackColor={{ false: "#767577", true: "#6366f1" }} // Example Indigo for Dark Track
                    thumbColor="#f4f3f4"
                    onValueChange={toggleTheme}
                    value={isDark}
                />
            </View>

{/* --- NEW: Font Size Option --- */}
            <View className={`p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <Text className={`text-lg mb-2 ${subtextColor}`}>
                    حجم الخط (Font Size)
                </Text>
                
                <View className="flex-row justify-around mt-2">
                    {Object.keys(FONT_SIZES).map((key: string) => {
                        const sizeKey = key as FontSizeKey;
                        const isSelected = sizeKey === fontSizeKey;
                        return (
                            <TouchableOpacity
                                key={sizeKey}
                                onPress={() => setFontSizeKey(sizeKey)}
                                className={`px-4 py-2 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${isSelected ? 'bg-indigo-500' : ''}`}
                            >
                                <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : subtextColor}`}>
                                    {sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
            
            {/* Placeholder for future settings */}
            <TouchableOpacity className={`p-4 border-b ${borderColor}`}>
                <Text className={`text-lg ${subtextColor}`}>
                    إعدادات إضافية قريباً...
                </Text>
            </TouchableOpacity>

        </View>
    );
}