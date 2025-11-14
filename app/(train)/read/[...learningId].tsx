// screens/ReadMemorizationScreen.tsx
import { useQuranAudio } from "@/hooks/useQuranAudio";
import { AyaTafseer, QuranWord, UserProgress } from "@/models/QuranModels";
import { fetchTafseersForAyaPairs } from "@/services/data/tafseerQueries";
import { fetchProgressRangeDb } from "@/services/data/userProgressQueries";
import { fetchDistinctAyasInRange, fetchWordsForAyaPairs } from "@/services/data/wordQueries";
import { toArabicNumber } from "@/services/Utilities";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, TouchableOpacity, View } from "react-native";


// ---------------------------------------------
// Local Types
// ---------------------------------------------
interface AyaWord {
    text: string;
    isHard: boolean;
    isEndOfAya: boolean;
    ayaNumber: number;
}

interface Aya {
    sura_id: number;
    aya_number: number;
    words: AyaWord[];
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------
const groupWordsIntoAyasFromWords = (words: QuranWord[], progressMap?: Record<number, UserProgress>): Aya[] => {
    const map = new Map<string, Aya>();

    words.forEach((word) => {
        const key = `${word.sura_id}-${word.aya_number}`;
        const progress = progressMap?.[word.id];
        const isHard = progress && progress.ease_factor <= 2 && (progress.lapses ?? 0) >= 3;

        const structuredWord: AyaWord = {
            text: word.text,
            isHard: isHard || false,
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
// Component: AyaItem
// ---------------------------------------------
interface AyaItemProps {
    item: Aya;
    tafseer?: AyaTafseer;
    isExpanded: boolean;
    isPlaying: boolean;
    onToggleExpand: (key: string) => void;
    onPlayPause: (item: Aya) => void;
}

const AyaItem: React.FC<AyaItemProps> = React.memo(({
    item,
    tafseer,
    isExpanded,
    isPlaying,
    onToggleExpand,
    onPlayPause,
}) => {
    const { t } = useTranslation();
    const key = `${item.sura_id}-${item.aya_number}`;

    const words = item.words.map((w, i) => {
        const endContent = w.isEndOfAya ? toArabicNumber(w.ayaNumber) + " " : " ";

        return (
            <Text
                key={i}
                className={`text-2xl font-uthmanic leading-relaxed ${
                    w.isHard ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                }`}
            >
                {w.text}
                {endContent}
            </Text>
        );
    });

    return (
        <View className="border-b border-gray-200 dark:border-gray-700 pb-3">
            {/* 1. منطقة الآية والأزرار القابلة للنقر لتوسيع التفسير */}
            {/* تم توسيع منطقة اللمس لتشمل الآية نفسها وأزرار التحكم */}
            <TouchableOpacity
                onPress={() => onToggleExpand(key)}
                // إزالة أي فئات انتقال (transition-) قد تسبب التأخير هنا
            >
                {/* نص الآية */}
                <Text className="text-right flex-row flex-wrap">{words}</Text>
                
                {/* 🎧 حاوية الأزرار: نستخدم View و flex-row لتنظيم الأزرار */}
                <View className="flex-row justify-between items-center mt-1">
                    {/* 1. زر التشغيل/الإيقاف المؤقت */}
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation(); // منع النقر من توسيع التفسير
                            onPlayPause(item);
                        }}
                        className="p-1"
                    >
                        <Ionicons
                            name={isPlaying ? "pause-circle" : "play-circle"}
                            size={28}
                            color={isPlaying ? "#EF4444" : "#10B981"}
                        />
                    </TouchableOpacity>

                    {/* 2. زر عرض/إخفاء التفسير */}
                    <View className="p-1">
                        <Text className="text-right text-sm text-indigo-600 dark:text-indigo-400">
                            {isExpanded ? t('read.hide_tafseer') : t('read.show_tafseer')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>


            {/* 2. منطقة التفسير الموسعة */}
            {isExpanded && (
                <View className="mt-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Text className="text-right text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                        {tafseer?.text ?? t('read.no_tafseer')}
                    </Text>
                </View>
            )}
        </View>
    );
});


// ---------------------------------------------
// Component: ReadMemorizationScreen (Main)
// ---------------------------------------------
export default function ReadMemorizationScreen() {
        const { t } = useTranslation();
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
    
    // 🎧 استخدام الخطاف المخصص للصوت
    const { playingKey, onPlayPause, ayaKey } = useQuranAudio();

    const onToggleExpand = useCallback((key: string) => {
        setExpandedKey((prev) => (prev === key ? null : key));
    }, []);

    const PAGE_SIZE = 20;

    const loadPage = useCallback(
        async (page: number) => {
            if ((page === 0 && loading === false && ayas.length > 0) || loadingMore) return;

            try {
                page === 0 ? setLoading(true) : setLoadingMore(true);

                const offset = page * PAGE_SIZE;
                const distinctPairs = await fetchDistinctAyasInRange(startWordId, endWordId, offset, PAGE_SIZE);

                if (!distinctPairs || distinctPairs.length === 0) {
                    setHasMore(false);
                    return;
                }

                const words = await fetchWordsForAyaPairs(distinctPairs);
                const tafseers = await fetchTafseersForAyaPairs(distinctPairs);

                // --- PROGRESS LOADING & MAPPING ---
                let progressMapForGrouping: Record<number, UserProgress> = progressMap;

                if (words.length > 0) {
                    const minWordId = Math.min(...words.map(w => w.id));
                    const maxWordId = Math.max(...words.map(w => w.id));
                    const progressList = await fetchProgressRangeDb(minWordId, maxWordId);

                    const newProgressMap: Record<number, UserProgress> = {};
                    progressList.forEach(p => { newProgressMap[p.word_id] = p; });

                    progressMapForGrouping = { ...progressMap, ...newProgressMap };
                    setProgressMap(prev => ({ ...prev, ...newProgressMap }));
                }
                // --- END PROGRESS LOADING ---


                const pageAyas = groupWordsIntoAyasFromWords(words, progressMapForGrouping);

                const newTafseerMap: Record<string, AyaTafseer> = {};
                tafseers.forEach((t) => {
                    newTafseerMap[ayaKey(t.sura_id, t.aya_number)] = t;
                });

                setAyas((prev) => {
                    const existingKeys = new Set(prev.map((p) => ayaKey(p.sura_id, p.aya_number)));
                    const filtered = pageAyas.filter((p) => !existingKeys.has(ayaKey(p.sura_id, p.aya_number)));
                    return [...prev, ...filtered];
                });

                setTafseersMap((prev) => ({ ...prev, ...newTafseerMap }));

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
        [startWordId, endWordId, PAGE_SIZE, ayas.length, loadingMore, progressMap, ayaKey]
    );

    useEffect(() => {
        setPageIndex(0);
        setAyas([]);
        setTafseersMap({});
        setHasMore(true);
        loadPage(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startWordId, endWordId]);

    const loadNext = async () => {
        if (!hasMore || loadingMore) return;
        const next = pageIndex + 1;
        setPageIndex(next);
        await loadPage(next);
    };

    // Render function now uses the dedicated component
    const renderItem = useCallback(({ item }: ListRenderItemInfo<Aya>) => {
        const key = ayaKey(item.sura_id, item.aya_number);
        return (
            <AyaItem
                item={item}
                tafseer={tafseersMap[key]}
                isExpanded={expandedKey === key}
                isPlaying={playingKey === key}
                onToggleExpand={onToggleExpand}
                onPlayPause={onPlayPause}
            />
        );
    }, [expandedKey, playingKey, tafseersMap, onToggleExpand, onPlayPause, ayaKey]);

    const keyExtractor = useCallback((item: Aya) => ayaKey(item.sura_id, item.aya_number), [ayaKey]);

    const ListFooter = useMemo(() => {
        if (loadingMore) {
            return (
                <View className="py-6 items-center">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-gray-500 mt-1">{t('read.load_more')}</Text>
                </View>
            );
        }

        if (!hasMore && ayas.length > 0) {
            return (
                <View className="py-6 items-center">
                    <Text className="text-gray-500">{t('read.end')}</Text>
                </View>
            );
        }

        return null;
    }, [loadingMore, hasMore, ayas.length]);

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