// app/(app)/_layout.tsx
import { useSettings } from '@/context/AppSettingContext';
import { AppActionsService } from '@/services/Utilities';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Text, TouchableOpacity, View } from 'react-native';

// ---------------------------------------------
// Custom Drawer Content
// ---------------------------------------------
function CustomDrawerContent({ isDark, ...props }: any) {
  const colors = {
    drawerBackground: isDark ? '#1f2937' : '#ffffff',
    divider: isDark ? '#374151' : '#e5e7eb',
    textPrimary: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#d1d5db' : '#6b7280',
    buttonBg: isDark ? '#374151' : '#E0E7FF',
    buttonText: isDark ? '#E0E7FF' : '#1E3A8A',
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.drawerBackground }}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* Header */}
      <View className="px-5 py-6 border-b" style={{ borderColor: colors.divider }}>
        <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
          📘 تطبيق متقن
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
          تطبيق مساعدة لحفظ القرآن الكريم
        </Text>
      </View>

      {/* Drawer items */}
      <DrawerItemList {...props} />

      {/* Extra actions */}
      <View className="px-4 mt-6 border-t pt-4" style={{ borderColor: colors.divider }}>
        <TouchableOpacity
          onPress={AppActionsService.rateApp}
          className="py-3 rounded-lg"
        >
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            ⭐ قيّم التطبيق
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={AppActionsService.shareApp}
          className="py-3 rounded-lg mt-2"
        >
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            🔗 مشاركة التطبيق
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={AppActionsService.sendFeedback}
          className="py-3 rounded-lg mt-2"
        >
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            ✉️ أرسل ملاحظاتك
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// ---------------------------------------------
// Main Layout
// ---------------------------------------------
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
        drawerActiveBackgroundColor: colors.drawerActiveBg,
        drawerActiveTintColor: colors.drawerActiveText,
        drawerInactiveTintColor: colors.drawerInactiveText,
        drawerLabelStyle: { fontSize: 16, fontWeight: '500' },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} isDark={isDark} />}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: 'الصفحة الرئيسية' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'الإعدادات' }} />
      <Drawer.Screen name="about" options={{ drawerLabel: 'حول التطبيق' }} />
    </Drawer>
  );
}
