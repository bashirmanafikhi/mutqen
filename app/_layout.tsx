// app/RootLayout.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppSettingsProvider, useSettings } from '../context/AppSettingContext';
import './globals.css';

SplashScreen.preventAutoHideAsync();

// ---------------------------------------------
// Theme Wrapper
// ---------------------------------------------
function ThemeWrapper({ children }: { children: ReactNode }) {
  const { isDark } = useSettings();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {children}
    </View>
  );
}

// ---------------------------------------------
// Root Layout
// ---------------------------------------------
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

  // ---------------------------------------------
  // Font loading error display
  // ---------------------------------------------
  if (fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 p-4">
        <Text className="text-red-600 text-lg font-bold mb-2">خطأ في تحميل الخطوط</Text>
        <Text className="text-red-500 text-sm text-center">{fontError}</Text>
      </View>
    );
  }

  // ---------------------------------------------
  // Font loading spinner
  // ---------------------------------------------
  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-gray-600 dark:text-gray-300 text-base">جاري تحميل الخطوط...</Text>
      </View>
    );
  }

  // ---------------------------------------------
  // Main App
  // ---------------------------------------------
  return (
    <AppSettingsProvider>
      <ThemeWrapper>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1">
            <Slot />
          </SafeAreaView>
        </SafeAreaProvider>
      </ThemeWrapper>
    </AppSettingsProvider>
  );
}
