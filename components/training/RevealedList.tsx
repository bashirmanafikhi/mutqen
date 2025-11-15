// src/components/training/RevealedList.tsx
import { useSettings } from '@/context/AppSettingContext';
import { toArabicNumber } from '@/services/Utilities';
import { WordWithProgress } from '@/services/data/TrainingQueryService';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface RevealedListProps {
  revealedWords: WordWithProgress[];
  onWordPress: (word: WordWithProgress) => void;
  compact?: boolean;
}

const RevealedList = forwardRef<FlatList<WordWithProgress>, RevealedListProps>(
  ({ revealedWords, onWordPress, compact = false }, ref) => {
    const { isDark } = useSettings();

    const renderItem = useCallback(({ item, index }: { item: WordWithProgress; index: number }) => (
      <RevealedWordRow
        word={item}
        index={index}
        onPress={onWordPress}
        isLast={index === revealedWords.length - 1}
        compact={compact}
      />
    ), [onWordPress, revealedWords.length, compact]);

    const keyExtractor = useCallback((item: WordWithProgress) => `revealed-${item.id}`, []);

    const data = useMemo(() => [...revealedWords].reverse(), [revealedWords]);

    return (
      <FlatList
        ref={ref}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ 
          paddingBottom: compact ? 8 : 16,
          paddingHorizontal: compact ? 0 : 0
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={compact ? 5 : 15}
        maxToRenderPerBatch={compact ? 5 : 10}
        windowSize={compact ? 3 : 5}
        className="flex-1"
      />
    );
  }
);

interface RevealedWordRowProps {
  word: WordWithProgress;
  index: number;
  onPress: (word: WordWithProgress) => void;
  isLast: boolean;
  compact?: boolean;
}

const RevealedWordRow = React.memo(({ word, index, onPress, isLast, compact = false }: RevealedWordRowProps) => {
  const { isDark } = useSettings();

  const hasProgress = word.memory_tier !== undefined && word.memory_tier > 0;
  const memoryLabels = ['لم تتعلم', 'ضعيف', 'متوسط', 'جيد', 'ممتاز'];

  if (compact) {
    return (
      <View className="mb-2">
        {/* Compact Word Card */}
        <TouchableOpacity
          onPress={() => onPress(word)}
          className={`flex-row items-center justify-between p-3 rounded-xl border ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          activeOpacity={0.7}
        >
          {/* Word Text - Centered */}
          <View className="flex-1 items-center">
            <Text className="text-xl font-uthmanic text-center text-gray-900 dark:text-gray-100">
              {word.text}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
              {word.sura_name} - {toArabicNumber(word.aya_number)}
            </Text>
          </View>

          {/* Memory Tier Badge - Smaller */}
          {hasProgress && (
            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Text className="text-[10px] text-gray-600 dark:text-gray-300">
                {memoryLabels[word.memory_tier!]}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Compact Aya Separator */}
        {!isLast && word.is_end_of_aya && (
          <View className="items-center mt-1">
            <View className={`w-6 h-0.5 rounded-full ${
              isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`} />
          </View>
        )}
      </View>
    );
  }

  // Original full-size layout
  return (
    <View className="mb-3">
      {/* Word Card */}
      <TouchableOpacity
        onPress={() => onPress(word)}
        className={`flex-row items-center justify-between p-4 rounded-2xl shadow-sm border ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        activeOpacity={0.7}
      >
        {/* Sequence Number */}
        <Text className={`text-sm font-mono ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          #{/* {revealedWords.length - index} */}
        </Text>

        {/* Word Text */}
        <View className="flex-1 mx-3 items-center">
          <Text className="text-2xl font-uthmanic text-center text-gray-900 dark:text-gray-100 mb-1">
            {word.text}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {word.sura_name} - آية {toArabicNumber(word.aya_number)}
          </Text>
        </View>

        {/* Memory Tier */}
        {hasProgress && (
          <View className={`px-2 py-1 rounded-full ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Text className="text-xs text-gray-600 dark:text-gray-300">
              {memoryLabels[word.memory_tier!]}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Aya Separator */}
      {!isLast && word.is_end_of_aya && (
        <View className="items-center mt-2">
          <View className={`w-8 h-0.5 rounded-full ${
            isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          <Text className="text-2xl font-uthmanic text-gray-700 dark:text-gray-300 mt-1">
            {toArabicNumber(word.aya_number)}
          </Text>
        </View>
      )}
    </View>
  );
});

export default RevealedList;