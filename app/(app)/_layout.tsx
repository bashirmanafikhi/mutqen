// app/(app)/_layout.tsx

import { useSettings } from '@/context/AppSettingContext';
import { Drawer } from 'expo-router/drawer';

export default function AppLayout() {
    const { isDark } = useSettings();
    const headerConfig = {
        headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' }, // bg-gray-800
        headerTintColor: isDark ? '#f9fafb' : '#111827', // text-gray-50
    };
    
    return (
        <Drawer screenOptions={headerConfig}> 
            {/* 1. This is your Main Page group. It will contain all visible drawer items. */}
            <Drawer.Screen 
                name="index" // This points to app/(app)/index.tsx (Your Learning List)
                options={{
                    title: "قائمة المحفوظات",
                    headerShown: true, // Show the header for the main screen
                }}
            />
            
            {/* 2. Settings Page */}
            <Drawer.Screen 
                name="settings" // This points to app/(app)/settings.tsx
                options={{
                    title: "الإعدادات",
                }}
            />
            
            {/* 3. About Page */}
            <Drawer.Screen 
                name="about" // This points to app/(app)/about.tsx
                options={{
                    title: "حول التطبيق",
                }}
            />
            
            {/* 4. Rate */}
            <Drawer.Screen 
                name="rate" // This points to app/(app)/about.tsx
                options={{
                    title: "تقييم التطبيق",
                }}
            />
        </Drawer>
    );
}