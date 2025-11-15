// app/(app)/_layout.tsx
import { useSettings } from '@/context/AppSettingContext';
import { AppActionsService } from '@/services/Utilities';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react'; // Added React import for safety
import { useTranslation } from 'react-i18next'; // 👈 Added for translation
import { Text, TouchableOpacity, View } from 'react-native';

// ---------------------------------------------
// Custom Drawer Content
// ---------------------------------------------
function CustomDrawerContent({ isDark, ...props }: any) {
  const { t } = useTranslation();

  const colors = {
    drawerBackground: isDark ? '#1f2937' : '#ffffff',
    divider: isDark ? '#374151' : '#e5e7eb',
    textPrimary: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#d1d5db' : '#6b7280',
    buttonBg: isDark ? '#374151' : '#E0E7FF',
    buttonText: isDark ? '#E0E7FF' : '#1E3A8A',
    iconColor: isDark ? '#E0E7FF' : '#1E3A8A',
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.drawerBackground }}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* Header */}
      <View className="px-5 py-6 border-b" style={{ borderColor: colors.divider }}>
        <View className="flex-row items-center">
          <Ionicons
            name="book"
            size={28}
            color={colors.iconColor}
            style={{ marginRight: 10 }}
          />
          <View>
            <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
              {t('app.name')} 
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
              {t('app.tagline')} 
            </Text>
          </View>
        </View>
      </View>

      {/* Drawer items */}
      <DrawerItemList {...props} />

      {/* Extra actions */}
      <View className="px-4 mt-6 border-t pt-4" style={{ borderColor: colors.divider }}>
        <TouchableOpacity
          onPress={AppActionsService.rateApp}
          className="py-3 rounded-lg flex-row items-center"
        >
          <Ionicons
            name="star"
            size={20}
            color={colors.iconColor}
            style={{ marginRight: 12 }}
          />
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            {t('drawer.rate_app')} 
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={AppActionsService.shareApp}
          className="py-3 rounded-lg mt-2 flex-row items-center"
        >
          <Ionicons
            name="share-social"
            size={20}
            color={colors.iconColor}
            style={{ marginRight: 12 }}
          />
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            {t('drawer.share_app')} 
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={AppActionsService.sendFeedback}
          className="py-3 rounded-lg mt-2 flex-row items-center"
        >
          <Ionicons
            name="mail"
            size={20}
            color={colors.iconColor}
            style={{ marginRight: 12 }}
          />
          <Text style={{ color: colors.buttonText }} className="text-base font-semibold">
            {t('drawer.send_feedback')} 
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
  const { t } = useTranslation(); // 👈 Added hook here
  const { isDark } = useSettings();

  const colors = {
    headerBg: isDark ? '#1f2937' : '#ffffff',
    headerText: isDark ? '#f9fafb' : '#111827',
    drawerActiveBg: isDark ? '#374151' : '#4F46E5',
    drawerActiveText: isDark ? '#f9fafb' : '#ffffff',
    drawerInactiveText: isDark ? '#d1d5db' : '#111827',
    drawerIconColor: isDark ? '#d1d5db' : '#6b7280',
    drawerActiveIconColor: isDark ? '#f9fafb' : '#ffffff',
  };

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerText,
        drawerActiveBackgroundColor: colors.drawerActiveBg,
        drawerActiveTintColor: colors.drawerActiveText,
        drawerInactiveTintColor: colors.drawerInactiveText,
        drawerLabelStyle: { fontSize: 16, fontWeight: '500', marginLeft: -16 },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} isDark={isDark} />}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: t('navigation.home'), 
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              className='mr-4'
              name={focused ? "home" : "home-outline"}
              size={size}
              color={focused ? colors.drawerActiveIconColor : colors.drawerIconColor}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: t('navigation.settings'), 
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              className='mr-4'
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={focused ? colors.drawerActiveIconColor : colors.drawerIconColor}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: t('navigation.about'), 
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              className='mr-4'
              name={focused ? "information-circle" : "information-circle-outline"}
              size={size}
              color={focused ? colors.drawerActiveIconColor : colors.drawerIconColor}
            />
          ),
        }}
      />
    </Drawer>
  );
}