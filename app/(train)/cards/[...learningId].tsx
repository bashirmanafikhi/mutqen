// app/(train)/[...learningId].tsx
import TrainingLayout from '@/components/training/TrainingLayout';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function RevealCardsTraining() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || 'تدريب المحفوظ';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <TrainingLayout startWordId={startWordId} endWordId={endWordId} />
    </>
  );
}
