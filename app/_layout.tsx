import * as Font from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import './globals.css';

// تم تحديث المسار إلى الاسم المستعار القياسي @/
import { AppSettingsProvider, useSettings } from '@/context/AppSettingContext';
import { Ionicons } from '@expo/vector-icons';

// إبقاء شاشة البداية مرئية حتى يتم تحميل الخطوط
SplashScreen.preventAutoHideAsync();

// 1. ThemeWrapper: يطبق الثيم وحجم الخط بشكل عام
function ThemeWrapper({ children }: { children: ReactNode }) {
    const { isDark } = useSettings();

    // نستخدم الـ 'dark' أو 'light' كـ className
    // ويتم تطبيق الألوان داخل المكونات الفرعية
    return (
        // تطبيق الكلاس 'dark' أو 'light' على الحاوية العليا
        <View className={`flex-1 ${isDark ? 'dark' : 'light'} bg-white dark:bg-gray-900`}>
            {children}
        </View>
    );
}


export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // نستخدم string لتخزين رسالة الخطأ لتجنب خطأ React "Objects are not valid as a React child"
  const [fontErrorMessage, setFontErrorMessage] = useState<string | null>(null); 

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
    try {
      console.log('START: بدء محاولة تحميل الخطوط والأيقونات...'); // <--- نقطة تتبع
      
      await Font.loadAsync({
        // ... (الخطوط المعلقة)
        ...Ionicons.font,
      });

      console.log('SUCCESS: تم تحميل الخطوط بنجاح.'); // <--- نقطة تتبع
      setFontsLoaded(true);

    } catch (e: any) {
      // ...
      console.error('FAILURE: خطأ في تحميل الخطوط!', e); // <--- نقطة تتبع
    } finally {
      setFontsLoaded(true);
      SplashScreen.hideAsync();
      console.log('FINALLY: إخفاء شاشة البداية، fontsLoaded =', true); // <--- نقطة تتبع
    }
  }

    loadResourcesAndDataAsync();
  }, []);

  if (fontErrorMessage) {
    // عرض رسالة الخطأ كـ Text بسيط 
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fefefe' }}>
        <Text style={{ color: 'red', fontSize: 16 }}>خطأ في تحميل الخطوط</Text>
        <Text style={{ color: 'red', fontSize: 12, textAlign: 'center' }}>{fontErrorMessage}</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    // يجب أن يعرض null فقط أثناء التحميل
        return null;
  }

  // 3. المحتوى الفعلي للتطبيق
  // نستخدم Slot لعرض محتوى المجلد الأول (مثل /app)
  return (
    <AppSettingsProvider>
      <ThemeWrapper>
        <Slot />
      </ThemeWrapper>
    </AppSettingsProvider>
  );
}
