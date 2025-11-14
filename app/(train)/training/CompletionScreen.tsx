// src/components/training/CompletionScreen.tsx
import { useSettings } from '@/context/AppSettingContext';
import { TrainingStats } from '@/models/TrainingModels';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CompletionScreenProps {
  stats: TrainingStats;
  totalWords: number;
  onRestart: () => void;
  startId: number;
  endId: number;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  stats,
  totalWords,
  onRestart,
  startId,
  endId
}) => {
  const { t } = useTranslation();
  const { isDark } = useSettings();
  const router = useRouter();

  const getPerformanceMessage = () => {
    if (stats.accuracy >= 90) return { message: 'أداء متميز!', icon: 'trophy', color: 'text-yellow-600' };
    if (stats.accuracy >= 75) return { message: 'عمل رائع!', icon: 'star', color: 'text-green-600' };
    if (stats.accuracy >= 60) return { message: 'جيد جداً', icon: 'thumbs-up', color: 'text-blue-600' };
    return { message: 'حاول مرة أخرى', icon: 'refresh', color: 'text-gray-600' };
  };

  const performance = getPerformanceMessage();

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 min-h-screen justify-center items-center p-6">
        {/* Celebration Icon */}
        <View className="items-center mb-8">
          <Ionicons 
            name={performance.icon as any} 
            size={80} 
            color={isDark ? "#818CF8" : "#6366F1"} 
          />
          <Text className={`text-3xl font-bold mt-4 text-center ${performance.color}`}>
            {performance.message}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-2 text-center">
            {t('training.session_completed')}
          </Text>
        </View>

        {/* Stats Card */}
        <View className={`w-full max-w-md p-6 rounded-2xl shadow-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } mb-6`}>
          <Text className={`text-xl font-bold text-center mb-6 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {t('training.session_summary')}
          </Text>

          <View className="space-y-4">
            {/* Accuracy */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                الدقة
              </Text>
              <View className="flex-row items-center">
                <Text className={`text-2xl font-bold ${
                  stats.accuracy >= 80 ? 'text-green-600' : 
                  stats.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stats.accuracy}%
                </Text>
              </View>
            </View>

            {/* Words Reviewed */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                الكلمات المراجعة
              </Text>
              <Text className="text-2xl font-bold text-indigo-600">
                {stats.wordsReviewed}
              </Text>
            </View>

            {/* Words Memorized */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                الكلمات المحفوظة
              </Text>
              <Text className="text-2xl font-bold text-purple-600">
                {stats.wordsMemorized}
              </Text>
            </View>

            {/* Current Streak */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                التسلسل الحالي
              </Text>
              <View className="flex-row items-center">
                <Ionicons 
                  name="flame" 
                  size={20} 
                  color={stats.currentStreak > 5 ? "#F59E0B" : "#6B7280"} 
                />
                <Text className={`text-2xl font-bold mr-1 ${
                  stats.currentStreak > 5 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {stats.currentStreak}
                </Text>
              </View>
            </View>

            {/* Completion Rate */}
            <View className="flex-row justify-between items-center">
              <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                معدل الإكمال
              </Text>
              <Text className="text-2xl font-bold text-blue-600">
                {Math.round((stats.wordsMemorized / totalWords) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full max-w-md space-y-4">
          <TouchableOpacity
            onPress={onRestart}
            className={`w-full py-4 rounded-2xl justify-center items-center shadow-lg ${
              isDark ? 'bg-indigo-600' : 'bg-indigo-500'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text className="text-white text-lg font-semibold mr-2">
                {t('training.restart_session')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-full py-4 rounded-2xl justify-center items-center border ${
              isDark 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="arrow-back" 
                size={20} 
                color={isDark ? "#D1D5DB" : "#6B7280"} 
              />
              <Text className={`text-lg font-semibold mr-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('training.return_home')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(train)/progress/[...learningId]',
              params: {
                learningId: ['all'],
                startWordId: startId.toString(),
                endWordId: endId.toString(),
                title: 'تقرير التقدم'
              }
            })}
            className={`w-full py-4 rounded-2xl justify-center items-center border ${
              isDark 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="stats-chart" 
                size={20} 
                color={isDark ? "#D1D5DB" : "#6B7280"} 
              />
              <Text className={`text-lg font-semibold mr-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('training.view_progress')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Motivational Quote */}
        <View className={`mt-8 p-4 rounded-xl ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <Text className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
            "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ"
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
            سورة القمر - الآية 17
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default CompletionScreen;