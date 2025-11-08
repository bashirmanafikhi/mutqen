// components/training/RevealedList.tsx
import { WordCard } from '@/models/QuranModels';
import { toArabicNumber } from '@/services/Utilities';
import React, { forwardRef } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  revealedWords: WordCard[];
  updateProgress: (wordId: number, quality: number, status: 'correct' | 'incorrect') => void;
}

const RevealedList = forwardRef<FlatList<WordCard>, Props>(({ revealedWords, updateProgress }, ref) => {
  const renderItem = ({ item }: { item: WordCard }) => {
    const isLast = revealedWords[revealedWords.length - 1]?.id === item.id;
    const bgColor =
      item.progressStatus === 'correct'
        ? 'bg-green-100 dark:bg-green-900/60'
        : 'bg-red-100 dark:bg-red-900/60';
    const textColor =
      item.progressStatus === 'correct'
        ? 'text-green-800 dark:text-green-100'
        : 'text-red-800 dark:text-red-100';

    const memoryLabels = ['(غير متعلم)', '(ضعيف)', '(معتدل)', '(جيد)', '(متقن)'];
    return (
      <View className="mb-4">
        <View
          className={`flex-row items-center justify-between p-4 rounded-3xl shadow-lg transform hover:scale-105 ${bgColor}`}
        >
          <TouchableOpacity
            onPress={() =>
              updateProgress(
                item.id,
                item.progressStatus === 'correct' ? 1 : 5,
                item.progressStatus === 'correct' ? 'incorrect' : 'correct'
              )
            }
            className="px-3 py-1 rounded-lg border border-gray-400 dark:border-gray-300"
          >
            <Text className="text-sm font-semibold text-gray-400 dark:text-gray-300">تغيير</Text>
          </TouchableOpacity>

          <Text className={`text-3xl font-uthmanic text-center ${textColor} flex-1 mx-2`}>
            {item.text}
          </Text>

          {/* Memory tier and next review display */}
          <View className="mt-1 flex-col items-center">
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-300">
              {memoryLabels[item.memory_tier ?? 0]}
            </Text>
          </View>
          
        </View>

        {!isLast && item.is_end_of_aya ? (
          <Text className="text-4xl font-uthmanic text-center text-gray-700 dark:text-gray-300 mt-2">
            {toArabicNumber(item.aya_number)}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      inverted
      contentContainerStyle={{ flexDirection: 'column-reverse', paddingBottom: 16 }}
      ref={ref}
      data={revealedWords}
      renderItem={renderItem}
      keyExtractor={(item) => `revealed-${item.id}`}
    />
  );
});

export default RevealedList;
