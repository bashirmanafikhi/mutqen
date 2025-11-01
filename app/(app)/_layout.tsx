// app/(app)/_layout.tsx

import { useSettings } from '@/context/AppSettingContext';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Text, View } from 'react-native';

// Custom Drawer Content
function CustomDrawerContent(props: any, isDark: boolean) {
    const colors = {
        drawerBackground: isDark ? '#1f2937' : '#ffffff',
        activeBg: isDark ? '#374151' : '#4F46E5',
        activeText: isDark ? '#f9fafb' : '#ffffff',
        inactiveText: isDark ? '#d1d5db' : '#111827',
        primaryText: isDark ? '#817bf0' : '#4F46E5',
    };

    return (
        <DrawerContentScrollView
            {...props}
            style={{ backgroundColor: colors.drawerBackground }}
        >
            <View className="p-5 border-b border-gray-200 dark:border-gray-700">
                <Text
                    style={{ color: colors.primaryText }}
                    className="text-2xl font-bold"
                >
                    📘 تطبيق متقن
                </Text>
                <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                    تطبيق مساعدة لحفظ القرآن الكريم
                </Text>
            </View>

            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
}

export default function AppLayout() {
    const { isDark } = useSettings();

    const colors = {
        headerBg: isDark ? '#1f2937' : '#ffffff',
        headerText: isDark ? '#f9fafb' : '#111827',
        drawerActiveBg: isDark ? '#374151' : '#4F46E5',
        drawerActiveText: isDark ? '#f9fafb' : '#ffffff',
        drawerInactiveText: isDark ? '#d1d5db' : '#111827',
    };

    return (
        <Drawer
            screenOptions={{
                headerStyle: { backgroundColor: colors.headerBg },
                headerTintColor: colors.headerText,

                // FIX: set drawer colors for items
                drawerActiveBackgroundColor: colors.drawerActiveBg,
                drawerActiveTintColor: colors.drawerActiveText,
                drawerInactiveTintColor: colors.drawerInactiveText,
            }}
            drawerContent={(props) => CustomDrawerContent(props, isDark)}
        >
            <Drawer.Screen name="index" options={{ drawerLabel: "الصفحة الرئيسية" }} />
            <Drawer.Screen name="settings" options={{ title: "الإعدادات" }} />
            <Drawer.Screen name="about" options={{ title: "حول التطبيق" }} />
            <Drawer.Screen name="rate" options={{ title: "تقييم التطبيق" }} />
        </Drawer>
    );
}
