import i18n from '@/services/i18n';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export default function LanguageToggle() {
  const { t } = useTranslation();

  const changeToEn = () => i18n.changeLanguage('en');
  const changeToAr = () => i18n.changeLanguage('ar');

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity onPress={changeToAr} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700">
        <Text className="text-sm">{t('language.ar')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={changeToEn} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700">
        <Text className="text-sm">{t('language.en')}</Text>
      </TouchableOpacity>
    </View>
  );
}
