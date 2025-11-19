// src/components/training/RevealedList.tsx
import { useSettings } from '@/context/AppSettingContext';
import { toArabicNumber } from '@/services/Utilities';
import { WordWithProgress } from '@/services/data/TrainingQueryService';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface RevealedListProps {
  revealedWords: WordWithProgress[];
  onWordPress: (word: WordWithProgress) => void;
}

const RevealedList = forwardRef<FlatList<WordWithProgress>, RevealedListProps>(
  ({ revealedWords, onWordPress }, ref) => {

    const renderItem = useCallback(
      ({ item, index }: { item: WordWithProgress; index: number }) => (
        <RevealedWordRow
          word={item}
          isLast={index === 0}
          onPress={onWordPress}
        />
      ),
      [onWordPress, revealedWords.length]
    );

    const keyExtractor = useCallback((item: WordWithProgress) => `revealed-${item.id}`, []);

    const data = useMemo(() => [...revealedWords].reverse(), [revealedWords]);

    return (
      <FlatList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 0
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={4}
        className="flex-1"
        inverted={true}
      />
    );
  }
);

interface RevealedWordRowProps {
  word: WordWithProgress;
  onPress: (word: WordWithProgress) => void;
  isLast: boolean;
}

const RevealedWordRow = React.memo(({ word, onPress, isLast }: RevealedWordRowProps) => {
  const { isDark } = useSettings();

  const { t } = useTranslation();
  const memoryLabels = [
    t('training.memoryLabels.0'),
    t('training.memoryLabels.1'),
    t('training.memoryLabels.2'),
    t('training.memoryLabels.3'),
    t('training.memoryLabels.4')
  ];

  return (
    <View className="mb-3">
      {/* Word Card */}
      <TouchableOpacity
        onPress={() => onPress(word)}
        className={`flex-row items-center justify-between p-4 rounded-2xl shadow-sm border ${isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
          }`}
        activeOpacity={0.7}
      >

        {/* Memory Tier Badge */}
        <View className={`ml-2 px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
          <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {word.sura_name}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
            آية {toArabicNumber(word.aya_number)}
          </Text>
        </View>

        {/* Word Text - Centered */}
        <View className="flex-1 items-center">
          <Text className={`p-2 ${isLast ? "text-4xl" : "text-3xl"} font-uthmanic text-center text-gray-900 dark:text-gray-100 mb-1`}>
            {word.text}
          </Text>
        </View>

        {/* Memory Tier Badge */}
        <View className={`ml-2 px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
          <Text className="text-xs text-gray-600 dark:text-gray-300">
            {memoryLabels[word.memory_tier!]}
          </Text>
          <Text className="text-xs text-gray-600 dark:text-gray-300 text-center">
            
            {word.ease_factor !== undefined && `EF: ${word.ease_factor.toFixed(1)}`}

          </Text>
        </View>

      </TouchableOpacity>

      {/* Aya Separator */}
      {!isLast && word.is_end_of_aya && (
        <View className="items-center mt-2">
          <Text className="text-4xl font-uthmanic text-gray-700 dark:text-gray-300 mt-1">
            {toArabicNumber(word.aya_number)}
          </Text>
        </View>
      )}
    </View>
  );
});

RevealedList.displayName = 'RevealedList';
RevealedWordRow.displayName = 'RevealedWordRow';

export default RevealedList;
