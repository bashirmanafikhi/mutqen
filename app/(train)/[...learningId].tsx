// app/(train)/[...learningId].tsx

import WordCardComponent from '@/components/WordCard';
import { QuranWord, WordCard } from '@/models/QuranModels';
import { fetchProgressByWordId, fetchWordsByRange, upsertProgress } from '@/services/data/QuranQueries';
import { getUpdatedProgress } from '@/services/SpacedRepetitionService';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ===============================================
// Main Component
// ===============================================
export default function RevealCardsTraining() {
    const params = useLocalSearchParams();

    // Extract parameters
    const startWordId = parseInt(params.startWordId as string);
    const endWordId = parseInt(params.endWordId as string);
    const title = params.title as string || "تدريب المحفوظ";

    const [allWords, setAllWords] = useState<WordCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter words that have been revealed/completed (move up)
    const revealedWords = useMemo(() => allWords.filter(w => w.isRevealed), [allWords]);
    // Filter words that are still hidden (stay down)
    const hiddenWords = useMemo(() => allWords.filter(w => !w.isRevealed), [allWords]);

    // Get the current word to be shown (the first hidden word)
    const currentHiddenWord = hiddenWords[0];

    // --- Data Fetching and Preparation ---
    const loadWords = useCallback(async () => {
        if (!startWordId || !endWordId) {
            Alert.alert("خطأ", "لم يتم تمرير معرّفات الكلمات بشكل صحيح.");
            return;
        }
        setIsLoading(true);
        try {
            const rawWords: QuranWord[] = await fetchWordsByRange(startWordId, endWordId);

            // Initial map to UI state (WordCard)
            const initialCards: WordCard[] = rawWords.map((word, index, arr) => {
                const prevWord = arr[index - 1];

                return {
                    ...word,
                    isRevealed: false,
                    progressStatus: 'hidden',
                    suraName: `سورة ${word.sura_id}`, // Placeholder, should be fetched
                    // UX checks
                    isFirstAyaWord: prevWord ? prevWord.aya_number !== word.aya_number : true,
                    isFirstSuraWord: index === 0, // Simplified: first word in range
                };
            });
            setAllWords(initialCards);
        } catch (error) {
            console.error("Failed to load words:", error);
            Alert.alert("خطأ", "فشل تحميل كلمات المحفوظ.");
        } finally {
            setIsLoading(false);
        }
    }, [startWordId, endWordId]);

    useEffect(() => {
        loadWords();
    }, [loadWords]);

    // --- Progress Update Logic (No change) ---

    const updateWordProgress = useCallback(async (wordId: number, quality: number, status: 'correct' | 'incorrect') => {
        try {
            // 1. Fetch current progress
            const currentProgress = await fetchProgressByWordId(wordId);

            // 2. Calculate new progress using SRS service
            const newProgress = getUpdatedProgress(currentProgress, quality);
            newProgress.word_id = wordId; // Ensure ID is set

            // 3. Upsert to database
            await upsertProgress(newProgress);

            // 4. Update UI state: Mark as revealed and set status
            setAllWords(prev => prev.map(word => {
                if (word.id === wordId) {
                    return { ...word, isRevealed: true, progressStatus: status };
                }
                return word;
            }));

        } catch (error) {
            console.error(`Error updating progress for word ${wordId}:`, error);
        }
    }, []);

    // --- Handlers for WordCard (No change) ---

    const handleReveal = (wordId: number) => {
        setAllWords(prev => prev.map(word => {
            if (word.id === wordId) {
                return { ...word, isRevealed: true };
            }
            return word;
        }));
    };

    const handleProgressConfirmation = (wordId: number, isCorrect: boolean) => {
        const quality = isCorrect ? 5 : 1;
        const status = isCorrect ? 'correct' : 'incorrect';
        updateWordProgress(wordId, quality, status);
    };

    const handleSwipeAction = (wordId: number, isCorrect: boolean) => {
        // Since the swiped card is always the current one, this is correct.
        handleProgressConfirmation(wordId, isCorrect);
    };


    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-lg text-gray-500">جاري تحميل كلمات المحفوظ...</Text>
            </View>
        );
    }

    // Render an individual revealed word in the top list (No change)
    const renderRevealedItem = ({ item }: { item: WordCard }) => (
        <View className="flex-row items-center justify-between m-4 p-4 rounded-lg"
            style={{ backgroundColor: item.progressStatus === 'correct' ? '#D1FAE5' : '#FEE2E2' }}>
            <Text className="text-lg font-arabic font-semibold">{item.text}</Text>

            {/* Options to change mind (Negative/Positive) */}
            <View className="flex-row space-x-2">
                <TouchableOpacity onPress={() => handleProgressConfirmation(item.id, item.progressStatus !== 'correct')} className="p-2 rounded-md border">
                    <Text>تغيير</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
            <Stack.Screen options={{ title: title, headerBackTitle: "عودة" }} />

            {/* 1. Revealed Words List */}
            <View style={{ flex: 3 }} className="border-b border-gray-200 dark:border-gray-700 bg-white">
                <FlatList
                    data={revealedWords.reverse()}
                    renderItem={renderRevealedItem}
                    keyExtractor={(item) => `revealed-${item.id}`}
                    ListHeaderComponent={<Text className="text-center text-xl font-bold p-3 border-b border-gray-200 dark:border-gray-700 dark:text-white">الكلمات المكتشفة</Text>}
                />
            </View>


            {/* 2. Hidden Cards Area */}
            <GestureHandlerRootView className="flex-1">

                <View className="p-4 justify-end items-center">
                    <Text className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 dark:bg-gray-900 mb-4">الكلمة التالية ({hiddenWords.length} متبقية)</Text>

                    {currentHiddenWord && (
                        <View className="w-full max-w-sm mb-2">
                            <WordCardComponent
                                key={currentHiddenWord.id}
                                card={currentHiddenWord}
                                onReveal={handleReveal}
                                onSwipeAction={handleSwipeAction}
                            />
                        </View>
                    )}
                </View>
            </GestureHandlerRootView>

            {/* End of training overlay */}
            {hiddenWords.length === 0 && (
                <View className="absolute inset-0 justify-center items-center bg-black/50">
                    <Text className="text-3xl text-white font-bold p-6 bg-green-600 rounded-lg">✅ انتهى التدريب!</Text>
                </View>
            )}

        </View>
    );

}