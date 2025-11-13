// app/(train)/[...learningId].tsx
import TrainingLayout from '@/components/training/TrainingLayout';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function RevealCardsTraining() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const { t } = useTranslation();
  const title = (params.title as string) || t('training.revealed_title', { count: 0 });

  return (
    <>
      <Stack.Screen options={{ title }} />
      <TrainingLayout startWordId={startWordId} endWordId={endWordId} />
    </>
  );
}
