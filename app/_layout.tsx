// app/RootLayout.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // ADD THIS IMPORT
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSettingsProvider, useSettings } from '../context/AppSettingContext';
import '../services/i18n';
import './globals.css';

SplashScreen.preventAutoHideAsync();

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { isDark } = useSettings();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {children}
    </View>
  );
}

/**
 * غلاف لتطبيق المسافة السفلية (Bottom Inset) لتجنب شريط التنقل السفلي.
 */
function BottomSafeAreaWrapper({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    // تطبيق paddingBottom من الحواف الآمنة
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          calibri: require('../assets/fonts/calibri.ttf'),
          uthmanic_hafs1_ver13: require('../assets/fonts/uthmanic_hafs1_ver13.otf'),
          ...Ionicons.font,
        });
        setFontsLoaded(true);
      } catch (error: any) {
        setFontError(error?.message || 'خط غير معروف');
      } finally {
      SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  if (fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 p-4">
        <Text className="text-red-600 text-lg font-bold mb-2">خطأ في تحميل الخطوط</Text>
        <Text className="text-red-500 text-sm text-center">{fontError}</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-gray-600 dark:text-gray-300 text-base">جاري تحميل الخطوط...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppSettingsProvider>
        <ThemeWrapper>
          <SafeAreaProvider>
            <BottomSafeAreaWrapper>
              <Slot />
            </BottomSafeAreaWrapper>
          </SafeAreaProvider>
        </ThemeWrapper>
      </AppSettingsProvider>
    </GestureHandlerRootView>
  );
}