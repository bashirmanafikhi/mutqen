// app/(train)/training/[...learningId].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import TrainingSession from './TrainingSession';

export default function TrainingPage() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || 'جلسة التدريب';

  return (
    <>
      <Stack.Screen options={{ headerShown:false, statusBarHidden:true }} />
      <TrainingSession 
        startWordId={startWordId}
        endWordId={endWordId}
        title={title}
      />
    </>
  );
}