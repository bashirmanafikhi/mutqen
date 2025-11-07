// components/training/HiddenCardArea.tsx
import WordCardComponent from '@/components/WordCard';
import { WordCard } from '@/models/QuranModels';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  hiddenWords: WordCard[];
  updateProgress: (wordId: number, quality: number, status: 'correct' | 'incorrect') => void;
  restart: () => void;
}

export default function HiddenCardArea({ hiddenWords, updateProgress, restart }: Props) {
  const currentWord = hiddenWords[0];

  const handleReveal = (wordId: number, quality: number) => {
    const status = quality > 2.5 ? 'correct' : 'incorrect';
    updateProgress(wordId, quality, status);
  };

  const handleSwipeAction = (wordId: number, isCorrect: boolean) => {
    handleReveal(wordId, isCorrect ? 5 : 1);
  };

  if (!currentWord && hiddenWords.length === 0)
    return (
      <View className="justify-center items-center">
        <Text className="text-3xl text-white font-bold p-6 bg-green-600 rounded-lg">✅ انتهى التدريب!</Text>
        <TouchableOpacity onPress={restart} className="mt-4 px-6 py-3 bg-blue-600 rounded-lg">
          <Text className="text-white text-lg font-semibold">إعادة التشغيل</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View className="p-4 justify-end items-center">
      <Text className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-4">
        ({hiddenWords.length} متبقية)
      </Text>
      {currentWord && (
        <View className="w-full max-w-sm">
          <WordCardComponent key={currentWord.id} card={currentWord} onReveal={handleReveal} onSwipeAction={handleSwipeAction} />
        </View>
      )}
    </View>
  );
}
