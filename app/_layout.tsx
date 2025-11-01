import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { AppSettingsProvider, useSettings } from '../context/AppSettingContext';
import './globals.css';

SplashScreen.preventAutoHideAsync();

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { isDark } = useSettings();
  const { setColorScheme } = useColorScheme();

  setColorScheme(isDark ? 'dark' : 'light');

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {children}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontErrorMessage, setFontErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          calibri: require('../assets/fonts/calibri.ttf'),
          uthmanic_hafs1_ver13: require('../assets/fonts/uthmanic_hafs1_ver13.otf'),
          ...Ionicons.font,
        });

        setFontsLoaded(true);
      } catch (e: any) {
        setFontErrorMessage(`فشل تحميل: ${e.message || 'خط غير معروف'}`);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    loadResources();
  }, []);

  if (fontErrorMessage) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-600 text-base">خطأ في تحميل الخطوط</Text>
        <Text className="text-red-600 text-xs text-center">{fontErrorMessage}</Text>
      </View>
    );
  }

  if (!fontsLoaded) return null;

  return (
    <AppSettingsProvider>
      <ThemeWrapper>
        <Slot />
      </ThemeWrapper>
    </AppSettingsProvider>
  );
}
