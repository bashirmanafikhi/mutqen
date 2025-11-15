// app/(train)/training/[...learningId].tsx
import { useSettings } from '@/context/AppSettingContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrainingSession from './TrainingSession';

export default function TrainingPage() {
  const { isDark } = useSettings();
  const { t } = useTranslation(); 

  // Use a variable for the background color
  const safeAreaBg: ColorValue = isDark ? '#1f2937' : '#ffffff'; 

  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  
  const title = (params.title as string) || t('trainingPage.default_title'); 

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: safeAreaBg }} edges={['top']}>
        <TrainingSession
          startWordId={startWordId}
          endWordId={endWordId}
          title={title}
        />
      </SafeAreaView>
    </>
  );
}