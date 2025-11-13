// app/(train)/progress/[...learningId].tsx
import { UserProgress } from "@/models/QuranModels";
import { fetchProgressRangeDb } from "@/services/data/userProgressQueries";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from "react-native";

export default function ReadProgress() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تقدّم الحفظ";

  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const list = await fetchProgressRangeDb(startWordId, endWordId);
        setProgressList(list);
      } catch (err) {
        console.error("Error loading progress:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [startWordId, endWordId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-gray-600 dark:text-gray-300 mt-2">{t('home.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 px-4 pt-6">
      <Stack.Screen options={{ title }} />

      {progressList.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 dark:text-gray-300 text-lg">{t('progress.no_data')}</Text>
        </View>
      ) : (
        <FlatList
          data={progressList}
          keyExtractor={(item) => item.word_id.toString()}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl shadow-sm">
              <Text className="text-right text-gray-900 dark:text-gray-100 font-semibold">
                الكلمة #{item.word_id}
              </Text>

              <View className="mt-2 space-y-1">
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  🔁 عدد المراجعات: {item.review_count}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  ⚙️ عامل السهولة: {item.ease_factor.toFixed(2)}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  🕓 الفترة الحالية: {item.current_interval} ثانية
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  ❌ مرات النسيان: {item.lapses}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  💭 مستوى الذاكرة: {item.memory_tier}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  📅 المراجعة القادمة: {item.next_review_date}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  🗓️ آخر مراجعة: {item.last_review_date}
                </Text>
                {item.last_successful_date && (
                  <Text className="text-gray-700 dark:text-gray-300 text-sm">
                    ✅ آخر نجاح: {item.last_successful_date}
                  </Text>
                )}
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
