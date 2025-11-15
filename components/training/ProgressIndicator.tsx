// src/components/training/ProgressIndicator.tsx
import { useSettings } from '@/context/AppSettingContext';
import { ProgressIndicatorProps } from '@/models/TrainingModels';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentWordId,
  startId,
  endId,
  totalWords,
  completedWords,
  mode,
  dueReviewsCount = 0
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
      case 'review': return { 
        bg: 'bg-blue-500', 
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'refresh-circle' as const
      };
      case 'memorization': return { 
        bg: 'bg-purple-500', 
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'add-circle' as const
      };
      default: return { 
        bg: 'bg-green-500', 
        text: 'text-green-700 dark:text-green-300',
        icon: 'shuffle' as const
      };
    }
  };

  const modeColors = getModeColor();

  const getModeText = () => {
    switch (mode) {
      case 'review': return `وضع المراجعة ${dueReviewsCount > 0 ? `(${dueReviewsCount})` : ''}`;
      case 'memorization': return 'وضع الحفظ الجديد';
      default: return 'وضع مختلط';
    }
  };

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
          <Ionicons 
            name={modeColors.icon} 
            size={16} 
            color={isDark ? 
              (mode === 'review' ? '#93C5FD' : 
               mode === 'memorization' ? '#D8B4FE' : '#86EFAC') : 
              (mode === 'review' ? '#1D4ED8' : 
               mode === 'memorization' ? '#7E22CE' : '#16A34A')
            } 
          />
          <Text className={`text-sm font-medium mr-2 ${modeColors.text}`}>
            {getModeText()}
          </Text>
        </View>

        <View className="flex-row space-x-4">
          {/* Due Reviews Count */}
          {dueReviewsCount > 0 && mode !== 'review' && (
            <View className="items-center">
              <Text className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                مستحقة
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="time" size={12} color="#F59E0B" />
                <Text className={`text-sm font-bold mr-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {dueReviewsCount}
                </Text>
              </View>
            </View>
          )}

          {/* Completion Progress */}
          <View className="items-center">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              الإكمال
            </Text>
            <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {completionPercentage}%
            </Text>
          </View>

          {/* Words Count */}
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

      {/* Range Info with Due Reviews */}
      <View className="flex-row justify-between items-center mt-1">
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          الكلمة {currentWordId} من {startId} إلى {endId}
        </Text>
        
        {/* Due Reviews Indicator */}
        {dueReviewsCount > 0 && mode !== 'review' && (
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={12} color="#F59E0B" />
            <Text className={`text-xs mr-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {dueReviewsCount} كلمة تحتاج مراجعة
            </Text>
          </View>
        )}

        {/* In Review Mode Indicator */}
        {mode === 'review' && dueReviewsCount > 0 && (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-done" size={12} color="#10B981" />
            <Text className={`text-xs mr-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              جاري مراجعة {dueReviewsCount} كلمة
            </Text>
          </View>
        )}
      </View>

      {/* Progress Breakdown */}
      <View className="flex-row justify-between items-center mt-2">
        <View className="flex-row items-center space-x-3">
          {/* Memorized Words */}
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              محفوظة: {completedWords}
            </Text>
          </View>
          
          {/* Due Reviews */}
          {dueReviewsCount > 0 && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-amber-500 mr-1" />
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                مستحقة: {dueReviewsCount}
              </Text>
            </View>
          )}
          
          {/* Remaining Words */}
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-gray-400 mr-1" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              متبقية: {totalWords - completedWords}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProgressIndicator;