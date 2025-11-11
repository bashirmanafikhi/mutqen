// screens/ReadMemorizationScreen.tsx
import { AyaTafseer, QuranWord } from "@/models/QuranModels";
import { toArabicNumber } from "@/services/Utilities";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, TouchableOpacity, View } from "react-native";

import { fetchTafseersForAyaPairs } from "@/services/data/tafseerQueries";
import {
  fetchDistinctAyasInRange,
  fetchWordsForAyaPairs
} from "@/services/data/wordQueries";

// ---------------------------------------------
// Local Types
// ---------------------------------------------
interface Aya {
  sura_id: number;
  aya_number: number;
  text: string;
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------
const groupWordsIntoAyasFromWords = (words: QuranWord[]): Aya[] => {
  const map = new Map<string, Aya>();

  words.forEach((word) => {
    const key = `${word.sura_id}-${word.aya_number}`;
    const existing = map.get(key);
    const newText = existing ? `${existing.text} ${word.text}` : word.text;
    const finalText = word.is_end_of_aya ? `${newText} ${toArabicNumber(word.aya_number)}` : newText;
    map.set(key, {
      sura_id: word.sura_id,
      aya_number: word.aya_number,
      text: finalText.trim(),
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.sura_id === b.sura_id ? a.aya_number - b.aya_number : a.sura_id - b.sura_id
  );
};

// ---------------------------------------------
// Component
// ---------------------------------------------
export default function ReadMemorizationScreen() {
  const params = useLocalSearchParams();
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تلاوة وحفظ";

  // Data states
  const [ayas, setAyas] = useState<Aya[]>([]);
  const [tafseersMap, setTafseersMap] = useState<Record<string, AyaTafseer>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // helper to build key
  const ayaKey = (sura: number, aya: number) => `${sura}-${aya}`;

  // Load one page of distinct ayas (pairs), fetch words for them, then tafseer
  const loadPage = useCallback(
    async (page: number) => {
      // guard
      if ((page === 0 && loading === false && ayas.length > 0) || loadingMore) return;

      try {
        page === 0 ? setLoading(true) : setLoadingMore(true);

        const offset = page * PAGE_SIZE;
        const distinctPairs = await fetchDistinctAyasInRange(startWordId, endWordId, offset, PAGE_SIZE);

        if (!distinctPairs || distinctPairs.length === 0) {
          setHasMore(false);
          return;
        }

        // fetch words for these aya pairs
        const words = await fetchWordsForAyaPairs(distinctPairs);
        const pageAyas = groupWordsIntoAyasFromWords(words); // grouped & sorted for page

        // fetch tafseers for the same pairs
        const tafseers = await fetchTafseersForAyaPairs(distinctPairs);

        // build map for tafseers (key -> tafseer)
        const newTafseerMap: Record<string, AyaTafseer> = {};
        tafseers.forEach((t) => {
          newTafseerMap[ayaKey(t.sura_id, t.aya_number)] = t;
        });

        // append
        setAyas((prev) => {
          // prevent duplicates: ensure we don't append already present keys
          const existingKeys = new Set(prev.map((p) => ayaKey(p.sura_id, p.aya_number)));
          const filtered = pageAyas.filter((p) => !existingKeys.has(ayaKey(p.sura_id, p.aya_number)));
          return [...prev, ...filtered];
        });

        setTafseersMap((prev) => ({ ...prev, ...newTafseerMap }));

        // if less than page size returned, then no more
        if (distinctPairs.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("❌ Error loading page:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [startWordId, endWordId, PAGE_SIZE, ayas.length, loadingMore]
  );

  // initial load
  useEffect(() => {
    setPageIndex(0);
    setAyas([]);
    setTafseersMap({});
    setHasMore(true);
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWordId, endWordId]);

  // load next page
  const loadNext = async () => {
    if (!hasMore || loadingMore) return;
    const next = pageIndex + 1;
    setPageIndex(next);
    await loadPage(next);
  };

  // render row
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Aya>) => {
    const key = ayaKey(item.sura_id, item.aya_number);
    const tafseer = tafseersMap[key];
    const isExpanded = expandedKey === key;

    return (
      <View key={key} className="border-b border-gray-200 dark:border-gray-700 pb-3">
        <TouchableOpacity onPress={() => setExpandedKey((prev) => (prev === key ? null : key))}>
          <Text className="text-right text-2xl font-uthmanic leading-relaxed text-gray-900 dark:text-gray-100">
            {item.text}
          </Text>
          <Text className="text-right text-sm text-indigo-600 dark:text-indigo-400 mt-1">
            {isExpanded ? "إخفاء التفسير ▲" : "عرض التفسير ▼"}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View className="mt-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <Text className="text-right text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {tafseer?.text ?? "لا يوجد تفسير لهذه الآية."}
            </Text>
          </View>
        )}
      </View>
    );
  }, [expandedKey, tafseersMap]);

  // key extractor
  const keyExtractor = useCallback((item: Aya) => ayaKey(item.sura_id, item.aya_number), []);

  // footer
  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text className="text-gray-500 mt-1">جاري تحميل المزيد...</Text>
        </View>
      );
    }

    if (!hasMore) {
      return (
        <View className="py-6 items-center">
          <Text className="text-gray-500">لا مزيد من الآيات</Text>
        </View>
      );
    }

    return null;
  }, [loadingMore, hasMore]);

  if (loading && ayas.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600 dark:text-gray-300 text-lg">جاري تحميل الآيات...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 pt-6 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen options={{ title }} />

      <FlatList
        data={ayas}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && hasMore) loadNext();
        }}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
