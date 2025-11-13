// app/(app)/_layout.tsx
import { useSettings } from '@/context/AppSettingContext';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Linking, Share, Text, TouchableOpacity, View } from 'react-native';

// ---------------------------------------------
// Custom Drawer Content
// ---------------------------------------------
function CustomDrawerContent({ isDark, ...props }: any) {
  const colors = {
    drawerBackground: isDark ? '#1f2937' : '#ffffff',
    activeBg: isDark ? '#374151' : '#4F46E5',
    activeText: isDark ? '#f9fafb' : '#ffffff',
    inactiveText: isDark ? '#d1d5db' : '#111827',
    primaryText: isDark ? '#817bf0' : '#4F46E5',
    subtitleText: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.drawerBackground }}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* Header */}
      <View className="px-5 py-6 border-b border-gray-200 dark:border-gray-700">
        <Text style={{ color: colors.primaryText }} className="text-2xl font-bold">
          📘 تطبيق متقن
        </Text>
        <Text style={{ color: colors.subtitleText }} className="text-sm mt-1">
          تطبيق مساعدة لحفظ القرآن الكريم
        </Text>
      </View>

      {/* Drawer items */}
      <DrawerItemList {...props} />

      {/* Extra actions */}
      <View className="px-4 mt-4">
        <TouchableOpacity
          onPress={async () => {
            try {
              const url = 'https://play.google.com/store/apps/details?id=com.bashirmanafikhi.Mutqen';
              await Linking.openURL(url);
            } catch (e) {
              console.warn('Unable to open store URL', e);
            }
          }}
          className="py-3 rounded-lg"
        >
          <Text style={{ color: colors.activeText }} className="text-base font-semibold">⭐ قيّم التطبيق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            try {
              const message = 'جرب تطبيق متقن لحفظ القرآن: https://play.google.com/store/apps/details?id=com.bashirmanafikhi.Mutqen';
              await Share.share({ message });
            } catch (e) {
              console.warn('Unable to share app', e);
            }
          }}
          className="py-3 rounded-lg mt-2"
        >
          <Text style={{ color: colors.activeText }} className="text-base font-semibold">🔗 مشاركة التطبيق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            try {
              const email = 'bashir.manafikhi@gmail.com';
              const subject = encodeURIComponent('ملاحظات حول تطبيق متقن');
              const body = encodeURIComponent('السلام عليكم،\n\nلدي الملاحظات التالية:\n\n');
              const mailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
              await Linking.openURL(mailUrl);
            } catch (e) {
              console.warn('Unable to open email app', e);
            }
          }}
          className="py-3 rounded-lg mt-2"
        >
          <Text style={{ color: colors.activeText }} className="text-base font-semibold">✉️ أرسل ملاحظاتك</Text>
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
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: "الصفحة الرئيسية" }}
      />
      <Drawer.Screen
        name="settings"
        options={{ drawerLabel: "الإعدادات" }}
      />
      <Drawer.Screen
        name="about"
        options={{ drawerLabel: "حول التطبيق" }}
      />
    </Drawer>
  );
}
