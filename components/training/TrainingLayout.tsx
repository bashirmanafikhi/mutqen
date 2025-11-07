// components/training/TrainingLayout.tsx
import { useTrainingWords } from '@/hooks/useTrainingWords';
import { WordCard } from '@/models/QuranModels';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HiddenCardArea from './HiddenCardArea';
import RevealedList from './RevealedList';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-lg text-gray-500 dark:text-gray-300">
          جاري تحميل كلمات المحفوظ...
        </Text>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Revealed Words Section */}
      <View
        style={{ height: SCREEN_HEIGHT * 0.55 }}
        className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-b-3xl shadow-inner"
      >
        <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 text-center">
          الكلمات المكتشفة ({revealedWords.length})
        </Text>
        <RevealedList ref={listRef} revealedWords={revealedWords} updateProgress={updateProgress} />
      </View>

      {/* Hidden Words / Card Area */}
      <GestureHandlerRootView
        style={{ flex: 1 }}
        className="p-4 justify-center items-center bg-gradient-to-t from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800"
      >
        <HiddenCardArea hiddenWords={hiddenWords} updateProgress={updateProgress} restart={restart} />
      </GestureHandlerRootView>
    </View>
  );
}
