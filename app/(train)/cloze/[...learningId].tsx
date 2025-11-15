// app/(train)/cloze/[...learningId].tsx
import TypingInput from '@/components/TypingInput';
import { useSettings } from '@/context/AppSettingContext';
import { QuranWord, UserProgress } from "@/models/QuranModels";
import { upsertProgressDb } from "@/services/data/userProgressQueries";
import { fetchWordsByRange } from "@/services/data/wordQueries";
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// -----------------------------
// Enhanced Types
// -----------------------------
type Blank = {
  indexInWords: number;
  correctText: string;
  userAnswer?: string;
  selectedChoice?: string;
  isCorrect?: boolean;
  choices?: string[];
  answeredAt?: Date;
  timeSpent?: number;
  wordId: number;
};

type Mode = "mcq" | "typing";
type Difficulty = "easy" | "medium" | "hard" | "expert";

interface SessionStats {
  correct: number;
  incorrect: number;
  totalAnswered: number;
  currentStreak: number;
  maxStreak: number;
  accuracy: number;
  totalTimeSpent: number;
  startTime: Date;
}

interface AyaGroup {
  suraId: number;
  ayaNumber: number;
  words: QuranWord[];
}

// -----------------------------
// Enhanced Helpers
// -----------------------------
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sample = <T,>(arr: T[], n = 1): T[] => {
  if (arr.length === 0) return [];
  if (n >= arr.length) return [...arr];
  return shuffle(arr).slice(0, n);
};

const normalize = (s?: string) =>
  (s || "")
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF]+/gu, "")
    .trim()
    .toLowerCase();


// -----------------------------
// Enhanced Component
// -----------------------------
export default memo(function EnhancedClozeTrainerScreen() {
  const params = useLocalSearchParams();
  const { isDark } = useSettings();
  const { t } = useTranslation();

  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = `${t('cloze.title')} (${params.title})`;

  // State Management
  const [words, setWords] = useState<QuranWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAyaIndex, setCurrentAyaIndex] = useState(0);
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [mode, setMode] = useState<Mode>("mcq");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [typingInput, setTypingInput] = useState("");
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    totalAnswered: 0,
    currentStreak: 0,
    maxStreak: 0,
    accuracy: 100,
    totalTimeSpent: 0,
    startTime: new Date()
  });
  const [batchSize] = useState(50);
  const [currentBatch, setCurrentBatch] = useState(0);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Memoized values
  const uniqueAyas = useMemo(() => {
    const ayaMap = new Map<string, AyaGroup>();
    words.forEach(word => {
      const key = `${word.sura_id}-${word.aya_number}`;
      if (!ayaMap.has(key)) {
        ayaMap.set(key, {
          suraId: word.sura_id,
          ayaNumber: word.aya_number,
          words: []
        });
      }
      ayaMap.get(key)!.words.push(word);
    });
    return Array.from(ayaMap.values());
  }, [words]);

  const currentAyaGroup = useMemo(() =>
    uniqueAyas[currentAyaIndex] || { suraId: 0, ayaNumber: 0, words: [] },
    [uniqueAyas, currentAyaIndex]
  );

  const currentAyaWords = currentAyaGroup.words;

  const wordPool = useMemo(() =>
    Array.from(new Set(words.map(w => w.text))).filter(Boolean),
    [words]
  );

  // Difficulty configurations
  const difficultyConfig = useMemo(() => ({
    easy: {
      blankPercentage: 0.2,
      optionsCount: 3,
      timeLimit: 0,
      minBlanks: 1,
      maxBlanks: 2
    },
    medium: {
      blankPercentage: 0.4,
      optionsCount: 4,
      timeLimit: 30,
      minBlanks: 1,
      maxBlanks: 3
    },
    hard: {
      blankPercentage: 0.6,
      optionsCount: 5,
      timeLimit: 20,
      minBlanks: 2,
      maxBlanks: 5
    },
    expert: {
      blankPercentage: 0.8,
      optionsCount: 6,
      timeLimit: 15,
      minBlanks: 3,
      maxBlanks: 8
    }
  }), []);

  // Load words with batching for large ranges
  const loadWords = useCallback(async (batchNumber: number = 0) => {
    try {
      const batchStart = startWordId + (batchNumber * batchSize);
      const batchEnd = Math.min(batchStart + batchSize - 1, endWordId);

      if (batchStart > endWordId) return;

      const data = await fetchWordsByRange(batchStart, batchEnd);
      if (data && data.length > 0) {
        setWords(prev => {
          const newWords = [...prev, ...data];
          const uniqueWords = Array.from(new Map(newWords.map(w => [w.id, w])).values());
          return uniqueWords;
        });
      }

      if (batchEnd < endWordId) {
        setCurrentBatch(batchNumber + 1);
      }
    } catch (err) {
      console.error("Error loading words:", err);
      Alert.alert(t('common.error'), t('errors.load_words'));
    } finally {
      setLoading(false);
    }
  }, [startWordId, endWordId, batchSize, t]);

  useEffect(() => {
    loadWords(0);
  }, []);

  // Generate blanks
  const generateBlanks = useCallback(() => {
    if (!currentAyaWords.length) return [];

    const config = difficultyConfig[difficulty];
    const targetBlanks = Math.max(
      config.minBlanks,
      Math.min(
        config.maxBlanks,
        Math.floor(currentAyaWords.length * config.blankPercentage)
      )
    );

    const availableIndexes = Array.from({ length: currentAyaWords.length }, (_, i) => i);
    const blankIndexes = sample(availableIndexes, Math.min(targetBlanks, currentAyaWords.length));

    if (blankIndexes.length === 0) {
      blankIndexes.push(Math.floor(currentAyaWords.length / 2));
    }

    const newBlanks: Blank[] = [];

    for (const index of blankIndexes) {
      const word = currentAyaWords[index];
      if (!word?.text) continue;

      const otherWords = wordPool.filter(w =>
        w && normalize(w) !== normalize(word.text)
      );

      const availableDistractors = Math.min(otherWords.length, config.optionsCount - 1);
      if (availableDistractors < 1) continue;

      const distractors = sample(otherWords, availableDistractors).filter(Boolean);
      const choices = shuffle([word.text, ...distractors]);

      if (!choices.some(choice => normalize(choice) === normalize(word.text))) {
        continue;
      }

      newBlanks.push({
        indexInWords: index,
        correctText: word.text,
        choices,
        answeredAt: undefined,
        timeSpent: 0,
        isCorrect: undefined,
        wordId: word.id
      });
    }

    if (newBlanks.length === 0 && currentAyaWords.length > 0) {
      const fallbackIndex = Math.floor(currentAyaWords.length / 2);
      const fallbackWord = currentAyaWords[fallbackIndex];

      if (fallbackWord?.text) {
        const simpleChoices = [
          fallbackWord.text,
          t('cloze.fallback.word'),
          t('cloze.fallback.term'),
          t('cloze.fallback.aya')
        ].filter(Boolean);

        newBlanks.push({
          indexInWords: fallbackIndex,
          correctText: fallbackWord.text,
          choices: shuffle(simpleChoices),
          answeredAt: undefined,
          timeSpent: 0,
          isCorrect: undefined,
          wordId: fallbackWord.id
        });
      }
    }

    return newBlanks.sort((a, b) => a.indexInWords - b.indexInWords);
  }, [currentAyaWords, difficulty, wordPool, difficultyConfig, t]);

  // Initialize blanks when aya changes
  useEffect(() => {
    if (currentAyaWords.length > 0) {
      const newBlanks = generateBlanks();

      if (newBlanks.length > 0) {
        setBlanks(newBlanks);
        setCurrentBlankIndex(0);
        setShowHint(false);
        setTimer(0);
        setTypingInput("");
        setQuestionStartTime(new Date());

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        goToNextAya();
      }
    }
  }, [currentAyaWords, difficulty]); // `goToNextAya` is not needed here

  // Timer effect
  useEffect(() => {
    const config = difficultyConfig[difficulty];
    if (config.timeLimit > 0 && blanks.length > 0 && currentBlankIndex < blanks.length) {
      const currentBlank = blanks[currentBlankIndex];
      if (!currentBlank?.isCorrect) {
        const interval = setInterval(() => {
          setTimer(prev => {
            if (prev >= config.timeLimit) {
              handleAnswer("");
              return 0;
            }
            return prev + 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [difficulty, blanks, currentBlankIndex]); // `handleAnswer` is not needed

  // Progress saving
  const saveProgress = useCallback(async (wordId: number, isCorrect: boolean) => {
    try {
      const progress: UserProgress = {
        created_at: new Date().toISOString(),
        word_id: wordId,
        current_interval: isCorrect ? 1 : 0,
        review_count: 1,
        ease_factor: isCorrect ? 2.5 : 1.3,
        next_review_date: new Date().toISOString(),
        last_review_date: new Date().toISOString(),
        last_successful_date: isCorrect ? new Date().toISOString() : null,
        memory_tier: isCorrect ? 1 : 0,
        lapses: isCorrect ? 0 : 1,
        notes: null
      };
      await upsertProgressDb(progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, []);

  // Handle answer submission
  const handleAnswer = useCallback(async (answer: string) => {
    if (blanks.length === 0 || currentBlankIndex >= blanks.length) return;

    const currentBlank = blanks[currentBlankIndex];
    if (!currentBlank) return;

    const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    const isCorrect = normalize(answer) === normalize(currentBlank.correctText);

    const updatedBlanks = blanks.map((blank, index) =>
      index === currentBlankIndex
        ? { ...blank, userAnswer: answer, isCorrect, answeredAt: new Date(), timeSpent }
        : blank
    );
    setBlanks(updatedBlanks);

    setSessionStats(prev => {
      const newCorrect = prev.correct + (isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (isCorrect ? 0 : 1);
      const newStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const totalAnswered = newCorrect + newIncorrect;
      const newAccuracy = totalAnswered > 0 ? Math.round((newCorrect / totalAnswered) * 100) : 100;

      return {
        correct: newCorrect,
        incorrect: newIncorrect,
        totalAnswered,
        currentStreak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        accuracy: newAccuracy,
        totalTimeSpent: prev.totalTimeSpent + timeSpent,
        startTime: prev.startTime
      };
    });

    if (currentBlank.wordId) {
      await saveProgress(currentBlank.wordId, isCorrect);
    }

    if (autoAdvance) {
      setTimeout(() => {
        if (currentBlankIndex < blanks.length - 1) {
          setCurrentBlankIndex(prev => prev + 1);
          setQuestionStartTime(new Date());
          setTimer(0);
          setShowHint(false);
          setTypingInput("");
        } else if (currentAyaIndex < uniqueAyas.length - 1) {
          goToNextAya();
        } else {
          // Alert needs sessionStats to be up-to-date, but state updates are async
          // We can read from the latest state closure
          setSessionStats(latestStats => {
            Alert.alert(
              t('cloze.session_complete'),
              t('cloze.session_complete_message', {
                accuracy: latestStats.accuracy,
                streak: latestStats.maxStreak
              }),
              [{ text: t('common.ok') }]
            );
            return latestStats;
          });
        }
      }, 1000);
    }
  }, [blanks, currentBlankIndex, currentAyaIndex, uniqueAyas.length, autoAdvance, questionStartTime, saveProgress, t]);

  // Navigation
  const goToNextAya = useCallback(() => {
    if (currentAyaIndex < uniqueAyas.length - 1) {
      setCurrentAyaIndex(prev => prev + 1);
      if (currentAyaIndex >= uniqueAyas.length - 5 && currentBatch * batchSize < (endWordId - startWordId)) {
        loadWords(currentBatch);
      }
    } else {
      Alert.alert(t('cloze.end_aya_title'), t('cloze.end_aya_msg'));
    }
  }, [currentAyaIndex, uniqueAyas.length, currentBatch, loadWords, batchSize, startWordId, endWordId, t]);

  const goToPreviousAya = useCallback(() => {
    if (currentAyaIndex > 0) {
      setCurrentAyaIndex(prev => prev - 1);
    }
  }, [currentAyaIndex]);

  // Render functions
  const renderAyaWithCurrentBlank = () => {
    if (!currentAyaWords.length || blanks.length === 0 || currentBlankIndex >= blanks.length) {
      return (
        <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <Text className="text-center text-gray-600 dark:text-gray-400">
            {t('cloze.loading_question')}
          </Text>
        </View>
      );
    }

    const currentBlank = blanks[currentBlankIndex];

    return (
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Text className="text-right text-2xl font-uthmanic leading-loose text-gray-900 dark:text-gray-100 mb-4">
          {currentAyaWords.map((word, index) => {
            const blankForThisPosition = blanks.find(blank => blank.indexInWords === index);

            if (blankForThisPosition) {
              if (blankForThisPosition === currentBlank) {
                const dotCount = Math.min(blankForThisPosition.correctText.length, 6);
                return (
                  <Text key={index} className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-lg border-2 border-yellow-400 mx-1">
                    {".".repeat(dotCount)}{" "}
                  </Text>
                );
              } else if (blankForThisPosition.isCorrect !== undefined) {
                const isCorrect = blankForThisPosition.isCorrect;
                
                return (
                  <Text
                    key={index}
                    className={`px-2 py-1 rounded-lg mx-1 border-2 ${isCorrect
                      ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-400 text-emerald-800 dark:text-emerald-200"
                      : "bg-red-100 dark:bg-red-900 border-red-400 text-red-800 dark:text-red-200" // Red for wrong answers
                      }`}
                  >
                    {blankForThisPosition.correctText}{" "}
                  </Text>
                );
              } else {
                const dotCount = Math.min(blankForThisPosition.correctText.length, 6);
                return (
                  <Text key={index} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-400 mx-1">
                    {".".repeat(dotCount)}{" "}
                  </Text>
                );
              }
            } else {
              return <Text key={index}>{word.text}{" "}</Text>;
            }
          })}
        </Text>

        <View className="flex-row justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {t('cloze.aya_info', { aya: currentAyaGroup.ayaNumber, sura: currentAyaGroup.suraId })}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {currentBlankIndex + 1} / {blanks.length}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderMCQOptions = () => {
    if (blanks.length === 0 || currentBlankIndex >= blanks.length) return null;

    const currentBlank = blanks[currentBlankIndex];
    if (!currentBlank?.choices) return null;

    return (
      <View className="flex-row flex-wrap justify-center mt-6 gap-3">
        {currentBlank.choices.map((choice, index) => {
          const isSelected = currentBlank.selectedChoice === choice;
          const isCorrect = currentBlank.isCorrect !== undefined && normalize(choice) === normalize(currentBlank.correctText);
          const isIncorrect = currentBlank.isCorrect === false && isSelected;

          let bgColor = "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600";
          if (isSelected) {
            bgColor = isCorrect ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-600";
          } else if (currentBlank.isCorrect !== undefined && isCorrect) {
            bgColor = "bg-emerald-500 border-emerald-600";
          }

          return (
            <TouchableOpacity
              key={index}
              className={`px-6 py-4 rounded-xl ${bgColor} min-w-[100px]`}
              onPress={() => !currentBlank.isCorrect && handleAnswer(choice)}
              disabled={currentBlank.isCorrect !== undefined}
            >
              <Text className={`text-lg font-uthmanic text-center ${isSelected || (currentBlank.isCorrect !== undefined && isCorrect)
                ? "text-white"
                : "text-gray-800 dark:text-gray-200"
                }`}>
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTypingInput = () => {
    return (
      <View className="mt-6" >
        <TypingInput
          blanks={blanks}
          currentBlankIndex={currentBlankIndex}
          typingInput={typingInput}
          setTypingInput={setTypingInput}
          showHint={showHint}
          setShowHint={setShowHint}
          handleAnswer={handleAnswer}
          t={t}
        />
      </View>
    );
  };

  const renderStats = () => (
    <View className="flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl mb-4">
      <View className="items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400">{t('stats.accuracy')}</Text>
        <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {sessionStats.accuracy}%
        </Text>
      </View>

      <View className="items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400">{t('stats.streak')}</Text>
        <View className="flex-row items-center">
          <Ionicons
            name="flame"
            size={16}
            color={sessionStats.currentStreak > 3 ? "#F59E0B" : "#6B7280"}
          />
          <Text className="text-lg font-bold text-amber-600 dark:text-amber-400 mr-1">
            {sessionStats.currentStreak}
          </Text>
        </View>
      </View>

      <View className="items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400">{t('stats.time')}</Text>
        <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {Math.floor(sessionStats.totalTimeSpent / 60)}:{(sessionStats.totalTimeSpent % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    </View>
  );

  // Loading state
  if (loading && words.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} justify-center items-center`}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300 text-lg">{t('cloze.loading_words')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Stack.Screen options={{
        title: title,
        headerStyle: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
      }} />

      <View className="flex-1 p-4">
        {renderStats()}

        {/* Mode and Difficulty Selector */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["mcq", "typing"] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                disabled={m === "typing"}
                className={`px-4 py-2 rounded-lg ${mode === m ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                onPress={() => {
                  setMode(m);
                  setTypingInput("");
                }}
              >
                <Text className={`font-medium ${mode === m ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {t(`cloze.mode.${m}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((diff) => (
              <TouchableOpacity
                key={diff}
                className={`px-3 py-2 rounded-lg ${difficulty === diff ?
                  diff === "easy" ? "bg-emerald-500" :
                    diff === "medium" ? "bg-blue-500" :
                      diff === "hard" ? "bg-orange-500" : "bg-red-500"
                  : ""}`}
                onPress={() => {
                  setDifficulty(diff);
                  setTypingInput("");
                }}
              >
                <Text className={`text-xs font-medium ${difficulty === diff ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>
                  {t(`cloze.difficulty.${diff}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timer */}
        {difficultyConfig[difficulty].timeLimit > 0 && (
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm text-gray-600 dark:text-gray-400">{t('cloze.time_remaining')}</Text>
              <Text className="text-sm font-bold text-amber-600">
                {t('cloze.seconds_remaining', { count: difficultyConfig[difficulty].timeLimit - timer })}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <View
                className="h-2 bg-amber-500 rounded-full"
                style={{
                  width: `${((difficultyConfig[difficulty].timeLimit - timer) / difficultyConfig[difficulty].timeLimit) * 100}%`
                }}
              />
            </View>
          </View>
        )}

        {/* Main Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {renderAyaWithCurrentBlank()}

          <View className="mt-6">
            {mode === "mcq" ? renderMCQOptions() : renderTypingInput()}
          </View>

          {/* Progress */}
          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600 dark:text-gray-400">{t('cloze.surah_progress')}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {currentAyaIndex + 1} / {uniqueAyas.length}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <View
                className="h-2 bg-indigo-500 rounded-full"
                style={{ width: `${((currentAyaIndex + 1) / uniqueAyas.length) * 100}%` }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Controls */}
        <View className="flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-xl flex-row items-center"
              onPress={goToPreviousAya}
              disabled={currentAyaIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentAyaIndex === 0 ? "#9CA3AF" : (isDark ? "#D1D5DB" : "#4B5563")}
              />
              <Text className={`mr-1 ${currentAyaIndex === 0 ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                {t('common.previous')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-500 px-4 py-3 rounded-xl flex-row items-center"
              onPress={goToNextAya}
            >
              <Text className="text-white font-bold mr-1">{t('common.next')}</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-red-500 px-4 py-3 rounded-xl flex-row items-center"
            onPress={() => {
              Alert.alert(
                t('cloze.end_session_title'),
                t('cloze.end_session_summary', {
                  accuracy: sessionStats.accuracy,
                  streak: sessionStats.currentStreak
                }),
                [
                  { text: t('common.continue'), style: "cancel" }
                ]
              );
            }}
          >
            <Ionicons name="flag" size={20} color="white" />
            <Text className="text-white font-bold mr-1">{t('common.end')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
});