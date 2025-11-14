// app/(train)/progress/[...learningId].tsx
import { useSettings } from '@/context/AppSettingContext';
import { QuranWord, UserProgress } from "@/models/QuranModels";
import { computeRangeTierStats, fetchProgressRangeDb } from "@/services/data/userProgressQueries";
import { fetchWordsByRange } from "@/services/data/wordQueries";
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View
} from "react-native";

const ITEMS_PER_LOAD = 50;

interface ProgressWithWord extends UserProgress {
  word?: QuranWord;
}

interface Analytics {
  totalWords: number;
  wordsWithProgress: number;
  masteredWords: number;
  averageEase: number;
  totalReviews: number;
  totalLapses: number;
  tierStats: any;
}

// Memoized Progress Item Component
const ProgressItem = React.memo(({ 
  item, 
  isDark 
}: { 
  item: ProgressWithWord; 
  isDark: boolean;
}) => {
  const getMemoryLevelInfo = useCallback((tier: number) => {
    const levels = [
      { icon: 'help-circle', color: '#EF4444', label: 'مبتدئ', bg: 'bg-red-100 dark:bg-red-900' },
      { icon: 'time', color: '#F59E0B', label: 'قيد التعلم', bg: 'bg-amber-100 dark:bg-amber-900' },
      { icon: 'trending-up', color: '#10B981', label: 'جيد', bg: 'bg-green-100 dark:bg-green-900' },
      { icon: 'star', color: '#8B5CF6', label: 'ممتاز', bg: 'bg-purple-100 dark:bg-purple-900' },
      { icon: 'trophy', color: '#F59E0B', label: 'متقن', bg: 'bg-yellow-100 dark:bg-yellow-900' }
    ];
    return levels[Math.min(tier, levels.length - 1)];
  }, []);

  const formatInterval = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} ساعة`;
    return `${Math.round(seconds / 86400)} يوم`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'لم تتم بعد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  }, []);

  const getEaseLevel = useCallback((ease: number) => {
    if (ease < 1.5) return { color: '#EF4444', label: 'صعب' };
    if (ease < 2.0) return { color: '#F59E0B', label: 'متوسط' };
    return { color: '#10B981', label: 'سهل' };
  }, []);

  const getSuraName = useCallback((suraId: number) => {
    const suraNames: { [key: number]: string } = {
      1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 
      4: "النساء", 5: "المائدة", 6: "الأنعام",
    };
    return suraNames[suraId] || `سورة ${suraId}`;
  }, []);

  const memoryInfo = useMemo(() => getMemoryLevelInfo(item.memory_tier), [item.memory_tier, getMemoryLevelInfo]);
  const easeInfo = useMemo(() => getEaseLevel(item.ease_factor), [item.ease_factor, getEaseLevel]);

  return (
    <View className="bg-white dark:bg-gray-800 mx-4 my-2 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with Word Info */}
      <View className="flex-row justify-between items-start mb-3">
        <View className={`flex-row items-center px-3 py-1 rounded-full ${memoryInfo.bg}`}>
          <Ionicons 
            name={memoryInfo.icon as any} 
            size={16} 
            color={memoryInfo.color} 
          />
          <Text className="text-xs font-semibold mr-2" style={{ color: memoryInfo.color }}>
            {memoryInfo.label}
          </Text>
        </View>
        
        <View className="items-end flex-1 mr-2">
          {item.word && (
            <>
              <Text className="text-lg font-bold text-gray-900 dark:text-white text-right mb-1">
                {item.word.text}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-right">
                {getSuraName(item.word.sura_id)} - الآية {item.word.aya_number}
              </Text>
            </>
          )}
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            الكلمة #{item.word_id}
          </Text>
        </View>
      </View>

      {/* Progress Stats */}
      <View className="space-y-3">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons 
              name="repeat" 
              size={16} 
              color="#6B7280" 
            />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              المراجعات:
            </Text>
          </View>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {item.review_count}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons 
              name="speedometer" 
              size={16} 
              color="#6B7280" 
            />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              مستوى السهولة:
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="font-semibold mr-2" style={{ color: easeInfo.color }}>
              {easeInfo.label}
            </Text>
            <Text className="text-xs text-gray-500">
              ({item.ease_factor.toFixed(2)})
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons 
              name="time" 
              size={16} 
              color="#6B7280" 
            />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              الفترة الحالية:
            </Text>
          </View>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {formatInterval(item.current_interval)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons 
              name="sad" 
              size={16} 
              color="#6B7280" 
            />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              مرات النسيان:
            </Text>
          </View>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {item.lapses}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons 
              name="calendar" 
              size={16} 
              color="#6B7280" 
            />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              المراجعة القادمة:
            </Text>
          </View>
          <Text className="font-semibold text-gray-900 dark:text-white">
            {formatDate(item.next_review_date)}
          </Text>
        </View>

        {item.last_successful_date && (
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color="#10B981" 
              />
              <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                آخر نجاح:
              </Text>
            </View>
            <Text className="font-semibold text-green-600 dark:text-green-400">
              {formatDate(item.last_successful_date)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

// Memoized Header Component
const ProgressHeader = React.memo(({ 
  analytics, 
  isDark 
}: { 
  analytics: Analytics; 
  isDark: boolean;
}) => (
  <View className="bg-white dark:bg-gray-800 mx-4 mt-4 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        ملخص التقدم الكلي
      </Text>
      <Ionicons 
        name="stats-chart" 
        size={24} 
        color={isDark ? "#818CF8" : "#6366F1"} 
      />
    </View>
    
    <View className="flex-row justify-between flex-wrap">
      <View className="items-center w-1/2 mb-3">
        <Text className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {analytics.wordsWithProgress}
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
          كلمات تم تعلمها
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          من أصل {analytics.totalWords}
        </Text>
      </View>
      
      <View className="items-center w-1/2 mb-3">
        <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
          {analytics.masteredWords}
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
          كلمات متقنة
        </Text>
      </View>
      
      <View className="items-center w-1/2">
        <View className="flex-row items-center">
          <Ionicons name="repeat" size={16} color="#6B7280" />
          <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-1">
            {analytics.totalReviews}
          </Text>
        </View>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
          إجمالي المراجعات
        </Text>
      </View>

      <View className="items-center w-1/2">
        <View className="flex-row items-center">
          <Ionicons name="trending-up" size={16} color="#6B7280" />
          <Text className="text-2xl font-bold text-amber-600 dark:text-amber-400 mr-1">
            {analytics.averageEase}
          </Text>
        </View>
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
          متوسط السهولة
        </Text>
      </View>
    </View>

    {/* Progress breakdown by tier */}
    {analytics.tierStats && analytics.tierStats.tiers && (
      <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
          توزيع مستويات الذاكرة
        </Text>
        <View className="flex-row justify-between">
          {Object.entries(analytics.tierStats.tiers).map(([tier, data]: [string, any]) => (
            <View key={tier} className="items-center">
              <Text className="text-lg font-bold" style={{ 
                color: tier === '0' ? '#6B7280' : 
                       tier === '1' ? '#EF4444' : 
                       tier === '2' ? '#F59E0B' : 
                       tier === '3' ? '#10B981' : '#8B5CF6' 
              }}>
                {data.count}
              </Text>
              <Text className="text-xs text-gray-500 text-center">
                {tier === '0' ? 'لم تتعلم' :
                 tier === '1' ? 'ضعيف' :
                 tier === '2' ? 'متوسط' :
                 tier === '3' ? 'جيد' : 'ممتاز'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </View>
));

export default function ReadProgress() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تقدّم الحفظ";
  const { isDark } = useSettings();
  const { t } = useTranslation();

  const [progressWithWords, setProgressWithWords] = useState<ProgressWithWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalWords: 0,
    wordsWithProgress: 0,
    masteredWords: 0,
    averageEase: 0,
    totalReviews: 0,
    totalLapses: 0,
    tierStats: {}
  });

  // Load analytics for the entire range
  const loadAnalytics = useCallback(async () => {
    try {
      const [allProgress, tierStats] = await Promise.all([
        fetchProgressRangeDb(startWordId, endWordId),
        computeRangeTierStats(startWordId, endWordId)
      ]);

      const totalWords = tierStats.total;
      const wordsWithProgress = allProgress.length;
      const masteredWords = allProgress.filter(p => p.memory_tier >= 3).length;
      const averageEase = wordsWithProgress > 0 
        ? Math.round(allProgress.reduce((acc, p) => acc + p.ease_factor, 0) / wordsWithProgress * 100) / 100
        : 0;
      const totalReviews = allProgress.reduce((acc, p) => acc + p.review_count, 0);
      const totalLapses = allProgress.reduce((acc, p) => acc + (p.lapses ?? 0), 0);

      setAnalytics({
        totalWords,
        wordsWithProgress,
        masteredWords,
        averageEase,
        totalReviews,
        totalLapses,
        tierStats
      });
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
  }, [startWordId, endWordId]);

  const loadProgressData = useCallback(async (offset: number = 0, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Calculate the range for this batch
      const batchStartId = startWordId + offset;
      const batchEndId = Math.min(batchStartId + ITEMS_PER_LOAD - 1, endWordId);

      if (batchStartId > endWordId) {
        setHasMore(false);
        return;
      }

      // Fetch progress for this batch
      const progressData = await fetchProgressRangeDb(batchStartId, batchEndId);

      if (progressData.length === 0) {
        // No progress in this batch, try next batch
        if (isRefresh || offset === 0) {
          setProgressWithWords([]);
        }
        setHasMore(batchEndId < endWordId);
        return;
      }

      // Get word IDs that have progress
      const wordIdsWithProgress = progressData.map(p => p.word_id);
      
      // Fetch word data only for words that have progress
      const wordsData = await fetchWordsByRange(
        Math.min(...wordIdsWithProgress),
        Math.max(...wordIdsWithProgress)
      );

      // Create a map of words for easy lookup
      const wordsMap = new Map(wordsData.map(word => [word.id, word]));

      // Combine progress with word data
      const combinedData: ProgressWithWord[] = progressData.map(progress => ({
        ...progress,
        word: wordsMap.get(progress.word_id)
      })).sort((a, b) => a.word_id - b.word_id);

      if (isRefresh || offset === 0) {
        setProgressWithWords(combinedData);
        setCurrentOffset(ITEMS_PER_LOAD);
      } else {
        // Avoid duplicates
        const existingIds = new Set(progressWithWords.map(p => p.word_id));
        const newItems = combinedData.filter(p => !existingIds.has(p.word_id));
        setProgressWithWords(prev => [...prev, ...newItems]);
        setCurrentOffset(prev => prev + ITEMS_PER_LOAD);
      }

      // Check if there's more data to load
      setHasMore(batchEndId < endWordId);

    } catch (err) {
      console.error("Error loading progress:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [startWordId, endWordId, progressWithWords]);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadAnalytics(),
        loadProgressData(0, false)
      ]);
    };
    initializeData();
  }, [loadAnalytics, loadProgressData]);

  const onRefresh = useCallback(() => {
    Promise.all([
      loadAnalytics(),
      loadProgressData(0, true)
    ]);
  }, [loadAnalytics, loadProgressData]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      loadProgressData(currentOffset, false);
    }
  }, [loadingMore, hasMore, loading, refreshing, currentOffset, loadProgressData]);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4 flex-row justify-center items-center">
        <ActivityIndicator size="small" color={isDark ? "#818CF8" : "#6366F1"} />
        <Text className="text-gray-600 dark:text-gray-300 mr-2">
          جاري تحميل المزيد...
        </Text>
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: ProgressWithWord }) => (
    <ProgressItem item={item} isDark={isDark} />
  ), [isDark]);

  const keyExtractor = useCallback((item: ProgressWithWord) => item.word_id.toString(), []);

  const memoizedHeader = useMemo(() => (
    <ProgressHeader analytics={analytics} isDark={isDark} />
  ), [analytics, isDark]);

  if (loading && progressWithWords.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={isDark ? "#818CF8" : "#6366F1"} />
        <Text className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
          {t('progress.loading_progress')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen options={{ title }} />

      {progressWithWords.length === 0 && !loading ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons 
            name="school-outline" 
            size={64} 
            color={isDark ? "#6B7280" : "#9CA3AF"} 
          />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center px-8 font-semibold">
            لم تبدأ التعلم بعد
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center px-8">
            إبدأ جلسة تدريب لرؤية تقدمك هنا
          </Text>
        </View>
      ) : (
        <FlatList
          data={progressWithWords}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3} // Increased threshold for better detection
          ListFooterComponent={renderFooter}
          ListHeaderComponent={memoizedHeader}
          maxToRenderPerBatch={10} // Render fewer items per batch
          updateCellsBatchingPeriod={50} // Batch updates
          windowSize={7} // Reduce window size
          initialNumToRender={10} // Render fewer items initially
          removeClippedSubviews={true} // Remove offscreen items
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? "#818CF8" : "#6366F1"]}
              tintColor={isDark ? "#818CF8" : "#6366F1"}
            />
          }
        />
      )}
    </View>
  );
}