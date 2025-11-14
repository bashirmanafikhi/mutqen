// src/components/training/ProgressIndicator.tsx
import { useSettings } from '@/context/AppSettingContext';
import { ProgressIndicatorProps } from '@/models/TrainingModels';
import React from 'react';
import { Text, View } from 'react-native';

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentWordId,
  startId,
  endId,
  totalWords,
  completedWords,
  mode
}) => {
  const { isDark } = useSettings();

  // Calculate progress percentage
  const totalRange = endId - startId + 1;
  const currentPosition = currentWordId - startId;
  const progressPercentage = Math.round((currentPosition / totalRange) * 100);

  // Calculate words progress
  const completionPercentage = totalWords > 0 
    ? Math.round((completedWords / totalWords) * 100)
    : 0;

  const getModeColor = () => {
    switch (mode) {
      case 'review': return { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' };
      case 'memorization': return { bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' };
      default: return { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300' };
    }
  };

  const modeColors = getModeColor();

  return (
    <View className="px-4 py-3 mb-2">
      {/* Progress Bar */}
      <View className={`h-3 rounded-full mb-3 ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <View 
          className={`h-3 rounded-full ${modeColors.bg}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      {/* Progress Info */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className={`w-3 h-3 rounded-full mr-2 ${modeColors.bg}`} />
          <Text className={`text-sm font-medium ${modeColors.text}`}>
            {mode === 'review' ? 'وضع المراجعة' : 
             mode === 'memorization' ? 'وضع الحفظ' : 'وضع مختلط'}
          </Text>
        </View>

        <View className="flex-row space-x-4">
          <View className="items-center">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              التقدم
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {progressPercentage}%
            </Text>
          </View>

          <View className="items-center">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              الكلمات
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {completedWords}/{totalWords}
            </Text>
          </View>
        </View>
      </View>

      {/* Range Info */}
      <Text className={`text-xs text-center mt-1 ${
        isDark ? 'text-gray-500' : 'text-gray-600'
      }`}>
        الكلمة {currentWordId} من {startId} إلى {endId}
      </Text>
    </View>
  );
};

export default ProgressIndicator;