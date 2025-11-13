import { WordCard } from '@/models/QuranModels';
import { toArabicNumber } from '@/services/Utilities';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  revealedWords: WordCard[];
  updateProgress: (wordId: number, quality: number, status: 'correct' | 'incorrect') => void;
}

const RevealedList = forwardRef<FlatList<WordCard>, Props>(
  ({ revealedWords, updateProgress }, ref) => {
    const { t } = useTranslation();
    const renderItem = useCallback(
      ({ item, index }: { item: WordCard; index: number }) => {
        const isLast = revealedWords[revealedWords.length - 1]?.id === item.id;
        return (
          <RevealedRow
            item={item}
            index={index}
            isLast={isLast}
            updateProgress={updateProgress}
          />
        );
      },
      [updateProgress, revealedWords]
    );

    const keyExtractor = useCallback((item: WordCard) => `revealed-${item.id}`, []);

    const data = useMemo(() => revealedWords, [revealedWords]);

    const contentStyle = { paddingBottom: 16 };

    return (
      <FlatList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={false}
      />
    );
  }
);

interface RowProps {
  item: WordCard;
  index: number;
  isLast: boolean;
  updateProgress: (wordId: number, quality: number, status: 'correct' | 'incorrect') => void;
}

  const RevealedRow = React.memo(({ item, index, isLast, updateProgress }: RowProps) => {
  const { t } = useTranslation();
  const isCorrect = item.progressStatus === 'correct';
  const bgColor = isCorrect ? 'bg-green-100 dark:bg-green-900/60' : 'bg-red-100 dark:bg-red-900/60';
  const textColor = isCorrect ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100';
  const memoryLabels = t('training.memory_labels', { returnObjects: true }) as string[];

  return (
    <View className="mb-4">
      <View className={`flex-row items-center justify-between p-4 rounded-3xl shadow-lg ${bgColor}`}>
        {/* Sequence number on the left */}
        <Text className="text-gray-400 dark:text-gray-500 text-sm mr-2">{index + 1}</Text>

        <TouchableOpacity
          onPress={() =>
            updateProgress(item.id, isCorrect ? 1 : 5, isCorrect ? 'incorrect' : 'correct')
          }
          className="px-3 py-1 rounded-lg border border-gray-400 dark:border-gray-300"
        >
          <Text className="text-sm font-semibold text-gray-400 dark:text-gray-300">{t('training.change')}</Text>
        </TouchableOpacity>

        <Text className={`text-4xl p-2 font-uthmanic text-center flex-1 mx-2 ${textColor}`}>
          {item.text}
        </Text>

        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-300">
          {memoryLabels[item.memory_tier ?? 0]}
        </Text>
      </View>

      {/* Aya number at the end of Aya */}
      {!isLast && item.is_end_of_aya ? (
        <Text className="text-4xl font-uthmanic text-center text-gray-700 dark:text-gray-300 mt-2">
          {toArabicNumber(item.aya_number)}
        </Text>
      ) : null}
    </View>
  );
});

export default RevealedList;
