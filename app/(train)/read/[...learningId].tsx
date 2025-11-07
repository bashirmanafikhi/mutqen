// screens/ReadMemorizationScreen.tsx
import { AyaTafseer, QuranWord } from "@/models/QuranModels";
import { fetchTafseersByRange, fetchWordsByRange } from "@/services/data/QuranQueries";
import { toArabicNumber } from "@/services/Utilities";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

// ---------------------------------------------
// Helper: group words into ayas
// ---------------------------------------------
interface Aya {
  aya_number: number;
  text: string;
}

const groupWordsIntoAyas = (words: QuranWord[]): Aya[] => {
  const map = new Map<number, string>();
  words.forEach((word) => {
    let current = map.get(word.aya_number) || "";
    current += " " + word.text;

    if (word.is_end_of_aya) {
      current += ` ${toArabicNumber(word.aya_number)} `;
    }

    map.set(word.aya_number, current.trim());
  });

  return Array.from(map.entries()).map(([aya_number, text]) => ({ aya_number, text }));
};

// ---------------------------------------------
// Component
// ---------------------------------------------
export default function ReadMemorizationScreen() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تلاوة وحفظ";

  const [words, setWords] = useState<QuranWord[]>([]);
  const [tafseers, setTafseers] = useState<AyaTafseer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAya, setExpandedAya] = useState<number | null>(null);

  // ---------------------------------------------
  // Load words & tafseers
  // ---------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchWordsByRange(startWordId, endWordId);
        setWords(data);

        if (data.length > 0) {
          const suraId = data[0].sura_id;
          const firstAya = data[0].aya_number;
          const lastAya = data[data.length - 1].aya_number;
          const tafseerData = await fetchTafseersByRange(suraId, firstAya, lastAya);
          setTafseers(tafseerData);
        }
      } catch (err) {
        console.error("❌ خطأ في تحميل البيانات:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const ayas = groupWordsIntoAyas(words);

  const toggleAya = (ayaNumber: number) => {
    setExpandedAya((prev) => (prev === ayaNumber ? null : ayaNumber));
  };

  // ---------------------------------------------
  // Loading state
  // ---------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600 dark:text-gray-300 text-lg">جاري تحميل الآيات...</Text>
      </View>
    );
  }

  // ---------------------------------------------
  // Main content
  // ---------------------------------------------
  return (
    <View className="flex-1 bg-white dark:bg-black px-4 pt-6">
      <Text className="text-center text-3xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">
        {title}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
        {ayas.map((item) => {
          const tafseer = tafseers.find((t) => t.aya_number === item.aya_number);
          const isExpanded = expandedAya === item.aya_number;

          return (
            <View key={item.aya_number} className="border-b border-gray-200 dark:border-gray-700 pb-3">
              {/* Aya Text */}
              <TouchableOpacity onPress={() => toggleAya(item.aya_number)}>
                <Text className="text-right text-2xl font-uthmanic leading-relaxed text-gray-900 dark:text-gray-100">
                  {item.text}
                </Text>

                <Text className="text-right text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                  {isExpanded ? "إخفاء التفسير ▲" : "عرض التفسير ▼"}
                </Text>
              </TouchableOpacity>

              {/* Tafseer */}
              {isExpanded && tafseer ? (
                <View className="mt-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <Text className="text-right text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tafseer.text}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
