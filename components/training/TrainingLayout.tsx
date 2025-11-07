// components/training/TrainingLayout.tsx
import { useTrainingWords } from '@/hooks/useTrainingWords';
import { WordCard } from '@/models/QuranModels';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HiddenCardArea from './HiddenCardArea';
import RevealedList from './RevealedList';

export default function TrainingLayout({ startWordId, endWordId }: { startWordId: number; endWordId: number }) {
  const { revealedWords, hiddenWords, isLoading, updateProgress, restart } = useTrainingWords(startWordId, endWordId);
  const listRef = useRef<FlatList<WordCard>>(null);

  useEffect(() => {
    if (revealedWords.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [revealedWords]);

  if (isLoading)
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-lg text-gray-500">جاري تحميل كلمات المحفوظ...</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
      <View style={{ flex: 2 }} className="mb-4">
        <RevealedList ref={listRef} revealedWords={revealedWords} updateProgress={updateProgress} />
      </View>
      <GestureHandlerRootView className="flex-1">
        <HiddenCardArea
          hiddenWords={hiddenWords}
          updateProgress={updateProgress}
          restart={restart}
        />
      </GestureHandlerRootView>
    </View>
  );
}
