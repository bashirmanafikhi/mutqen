import { QuranWord } from "@/models/QuranModels";
import { fetchWordsByRange } from "@/services/data/QuranQueries";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

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
      current += ` ﴿${word.aya_number}﴾ `;
    }

    map.set(word.aya_number, current.trim());
  });

  const result: Aya[] = [];
  map.forEach((t, n) => result.push({ aya_number: n, text: t }));
  return result;
};

export default function ReadMemorizationScreen() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تلاوة وحفظ";

  const [words, setWords] = useState<QuranWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchWordsByRange(startWordId, endWordId);
      setWords(data);
      setLoading(false);
    };
    load();
  }, []);

  const ayas = groupWordsIntoAyas(words);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600 dark:text-gray-300 text-lg">
          جاري تحميل الآيات...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black px-4 pt-6">
      <Text className="text-center text-3xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">
        {title}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {ayas.map((item) => (
          <View
            key={item.aya_number}
            className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700"
          >
            <Text className="text-right text-2xl leading-loose font-uthmanic text-gray-900 dark:text-gray-100">
              {item.text}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
