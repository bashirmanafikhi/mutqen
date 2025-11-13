// screens/ReadMemorizationScreen.tsx
import { AyaTafseer, QuranWord, UserProgress } from "@/models/QuranModels";
import { toArabicNumber } from "@/services/Utilities";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, TouchableOpacity, View } from "react-native";

import { fetchTafseersForAyaPairs } from "@/services/data/tafseerQueries";
import { fetchProgressRangeDb } from "@/services/data/userProgressQueries";
import {
  fetchDistinctAyasInRange,
  fetchWordsForAyaPairs
} from "@/services/data/wordQueries";

// ---------------------------------------------
// Local Types
// ---------------------------------------------
// Replace the current Aya interface with this:
interface AyaWord {
  text: string;
  isHard: boolean;
  isEndOfAya: boolean;
  ayaNumber: number; // To show the circle at the end
}

interface Aya {
  sura_id: number;
  aya_number: number;
  words: AyaWord[]; // List of structured words
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------
const groupWordsIntoAyasFromWords = (words: QuranWord[], progressMap?: Record<number, UserProgress>): Aya[] => {
  const map = new Map<string, Aya>();

  words.forEach((word) => {
    const key = `${word.sura_id}-${word.aya_number}`;
    const progress = progressMap?.[word.id];

    // Check if word is hard
    const isHard = progress && progress.ease_factor <= 2 && progress.lapses >= 3;

    // 1. Create the structured word object
    const structuredWord: AyaWord = {
      text: word.text,
      isHard: isHard!,
      isEndOfAya: word.is_end_of_aya,
      ayaNumber: word.aya_number,
    };

    const existing = map.get(key);

    if (existing) {
      existing.words.push(structuredWord);
    } else {
      map.set(key, {
        sura_id: word.sura_id,
        aya_number: word.aya_number,
        words: [structuredWord],
      });
    }
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
  const [progressMap, setProgressMap] = useState<Record<number, UserProgress>>({});


  const PAGE_SIZE = 20;

  // helper to build key
  const ayaKey = (sura: number, aya: number) => `${sura}-${aya}`;

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

        // fetch tafseers for the same pairs
        const tafseers = await fetchTafseersForAyaPairs(distinctPairs);

        // --- PROGRESS LOADING & MAPPING ---
        let progressMapForGrouping: Record<number, UserProgress> = progressMap; // Start with the existing state

        if (words.length > 0) {
          const minWordId = Math.min(...words.map(w => w.id));
          const maxWordId = Math.max(...words.map(w => w.id));
          const progressList = await fetchProgressRangeDb(minWordId, maxWordId);

          // Convert newly fetched list to a map
          const newProgressMap: Record<number, UserProgress> = {};
          progressList.forEach(p => { newProgressMap[p.word_id] = p; });

          // Merge the existing state with the new progress for immediate use
          progressMapForGrouping = { ...progressMap, ...newProgressMap };

          // Queue the update for the state (for the next render/renderItem)
          setProgressMap(prev => ({ ...prev, ...newProgressMap }));
        }
        // --- END PROGRESS LOADING ---


        // Group words into Ayas, passing the IMMEDIATELY AVAILABLE progress map
        const pageAyas = groupWordsIntoAyasFromWords(words, progressMapForGrouping); // <--- FIX IS HERE

        // build map for tafseers (key -> tafseer)
        const newTafseerMap: Record<string, AyaTafseer> = {};
        tafseers.forEach((t) => {
          newTafseerMap[ayaKey(t.sura_id, t.aya_number)] = t;
        });

        // append ayas
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
    // Ensure progressMap is in the dependency array since we read it directly for merging
    [startWordId, endWordId, PAGE_SIZE, ayas.length, loadingMore, progressMap]
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
  // render row
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Aya>) => {
  const key = ayaKey(item.sura_id, item.aya_number);
  const tafseer = tafseersMap[key];
  const isExpanded = expandedKey === key;

  // Iterate over the structured words array from the Aya object
  const words = item.words.map((w, i) => {
    // Determine the content to append after the word
    const endContent = w.isEndOfAya 
        ? toArabicNumber(w.ayaNumber) + " " 
        : " "; // Just a space if not end of aya
    
    return (
      <Text
        key={i}
        className={`text-2xl font-uthmanic leading-relaxed ${
          // Use the isHard property calculated and passed in the AyaWord object
          w.isHard ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {/* Render the word text */}
        {w.text}
        
        {/* Render the space or the Aya number followed by a space */}
        {endContent}
      </Text>
    );
  });

    return (
      <View key={key} className="border-b border-gray-200 dark:border-gray-700 pb-3">
        <TouchableOpacity onPress={() => setExpandedKey((prev) => (prev === key ? null : key))}>
          <Text className="text-right flex-row flex-wrap">{words}</Text>
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
  }, [expandedKey, tafseersMap, progressMap]);

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
