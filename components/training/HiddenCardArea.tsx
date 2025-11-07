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

  if (!currentWord && hiddenWords.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text
          key="training-finished"
          className="text-4xl text-white font-extrabold p-6 bg-green-500 dark:bg-green-700 rounded-3xl text-center shadow-lg animate-bounce"
        >
          🎉 انتهى التدريب!
        </Text>

        <TouchableOpacity
          key="restart-button"
          onPress={restart}
          className="mt-6 px-10 py-4 bg-indigo-500 dark:bg-indigo-600 rounded-2xl shadow-lg transform active:scale-95"
        >
          <Text className="text-white text-lg font-semibold text-center">
            إعادة التشغيل
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center px-4">
      {/* Remaining Words Counter */}
      <Text className="text-lg font-bold text-center text-gray-700 dark:text-gray-200 mb-1">
        ({hiddenWords.length} متبقية)
      </Text>

      {/* Current Word Card */}
      {currentWord && (
        <View className="w-full max-w-sm shadow-xl">
          <WordCardComponent
            key={currentWord.id}
            card={currentWord}
            onReveal={handleReveal}
            onSwipeAction={handleSwipeAction}
          />
        </View>
      )}

      {/* Spacer */}
      <View className="h-6" />
    </View>
  );
}
