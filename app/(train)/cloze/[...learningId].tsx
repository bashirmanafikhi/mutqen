// app/(train)/cloze/[...learningId].tsx
import { QuranWord, UserProgress } from "@/models/QuranModels";
import { upsertProgressDb } from "@/services/data/userProgressQueries";
import { fetchWordsByRange } from "@/services/data/wordQueries";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// -----------------------------
// Types
// -----------------------------
type Blank = {
  indexInWords: number;
  correctText: string;
  userAnswer?: string;
  selectedChoice?: string;
  isCorrect?: boolean;
  choices?: string[];
};

type Mode = "mcq" | "typing";

// -----------------------------
// Helpers
// -----------------------------
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sample = <T,>(arr: T[], n = 1): T[] => shuffle(arr).slice(0, n);

const normalize = (s?: string) =>
  (s || "")
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF]+/gu, "")
    .trim()
    .toLowerCase();

// Ensure correct answer is always included in choices
const buildChoices = (correct: string, pool: string[], optionsCount: number) => {
  const distractors = sample(pool.filter((w) => normalize(w) !== normalize(correct)), optionsCount - 1);
  return shuffle([correct, ...distractors]);
};

// -----------------------------
// Component
// -----------------------------
export default function ClozeTrainerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = `تمرين الفراغات (${params.title})`;

  const [words, setWords] = useState<QuranWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAyaWordIndexes, setCurrentAyaWordIndexes] = useState<number[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [mode, setMode] = useState<Mode>("mcq");
  const [difficulty, setDifficulty] = useState<number>(30);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchWordsByRange(startWordId, endWordId);
        if (!mounted) return;
        setWords(data || []);
        if (data && data.length > 0) {
          const firstAya = data[0].aya_number;
          const idxs = data.reduce<number[]>((acc, w, idx) => {
            if (w.aya_number === firstAya) acc.push(idx);
            return acc;
          }, []);
          setCurrentAyaWordIndexes(idxs);
        }
      } catch (err) {
        console.error("Error loading words:", err);
        Alert.alert("خطأ", "حدث خطأ أثناء جلب كلمات النطاق.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [startWordId, endWordId]);

  const wordPool = useMemo(() => Array.from(new Set(words.map((w) => w.text))).filter(Boolean), [words]);

  const buildBlanksForCurrentAya = (forceIndexes?: number[]) => {
    const ayaWordIdxs = forceIndexes ?? currentAyaWordIndexes;
    if (!ayaWordIdxs || ayaWordIdxs.length === 0) {
      setBlanks([]);
      return;
    }

    const maxBlanks = ayaWordIdxs.length;
    const target = Math.max(1, Math.round((difficulty / 100) * maxBlanks));
    const chosenIdxs = sample(ayaWordIdxs, Math.min(target, ayaWordIdxs.length));

    const newBlanks: Blank[] = chosenIdxs.map((wordIdx) => {
      const correct = words[wordIdx].text;
      const choices = buildChoices(correct, wordPool, optionsCount);
      return { indexInWords: wordIdx, correctText: correct, choices };
    });

    setScore({ correct: 0, total: newBlanks.length });
    setBlanks(newBlanks);
  };

  useEffect(() => { if (currentAyaWordIndexes.length > 0) buildBlanksForCurrentAya(); }, [currentAyaWordIndexes, difficulty, words, optionsCount]);

  const goToNextAya = () => {
    if (!words.length) return;
    const currentAyaNum = words[currentAyaWordIndexes[0]].aya_number;
    const remaining = words.filter((w) => w.aya_number > currentAyaNum);
    if (!remaining.length) return Alert.alert("انتهت الآيات", "لقد وصلت إلى نهاية النطاق.");
    const nextAyaNum = remaining[0].aya_number;
    const nextIdxs = words.reduce<number[]>((acc, w, idx) => {
      if (w.aya_number === nextAyaNum) acc.push(idx);
      return acc;
    }, []);
    setCurrentAyaWordIndexes(nextIdxs);
    setBlanks([]);
  };

  const handleAnswer = async (blankIdx: number, answer: string) => {
    setBlanks((prev) => prev.map((b, i) => i === blankIdx ? { ...b, userAnswer: answer, selectedChoice: answer } : b));

    const theBlank = blanks[blankIdx];
    const isCorrect = normalize(answer) === normalize(theBlank.correctText);

    setBlanks((prev) => prev.map((b, i) => i === blankIdx ? { ...b, isCorrect } : b));
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total }));

    try {
      const wordId = words[theBlank.indexInWords]?.id;
      if (wordId) {
        const progress: UserProgress = {
          word_id: wordId,
          current_interval: isCorrect ? 1 : 0,
          review_count: isCorrect ? 1 : 1,
          ease_factor: isCorrect ? 2.5 : 1.3,
          next_review_date: new Date().toISOString(),
          last_review_date: new Date().toISOString(),
          last_successful_date: null,
          memory_tier: 0,
          lapses: 0,
          notes: null
        };
        upsertProgressDb(progress).catch(() => {});
      }
    } catch {}

    if (autoAdvance && isCorrect) {
      const remainingUn = blanks.filter((b) => !b.isCorrect);
      if (!remainingUn.length) setTimeout(goToNextAya, 600);
    }
  };

  const renderAyaWithBlanks = () => {
    if (!words.length) return null;
    const fragment: (string | { blankIndex: number; placeholder: string })[] = [];
    const idxToBlankIndex: Record<number, number> = {};
    blanks.forEach((b, i) => (idxToBlankIndex[b.indexInWords] = i));

    currentAyaWordIndexes.forEach((wIdx) => {
      const w = words[wIdx];
      const blankIdx = idxToBlankIndex[wIdx];
      fragment.push(blankIdx !== undefined ? { blankIndex: blankIdx, placeholder: "____" } : w.text);
    });

    return (
      <View className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        <Text className="text-right text-2xl font-uthmanic leading-loose text-gray-900 dark:text-gray-100">
          {fragment.map((part, idx) =>
            typeof part === "string" ? (
              <Text key={idx} style={{ writingDirection: "rtl" }}>{part + " "}</Text>
            ) : (
              <Text key={idx} className="text-center px-2" style={{ textDecorationLine: "underline", writingDirection: "rtl" }}>{part.placeholder + " "}</Text>
            )
          )}
        </Text>
      </View>
    );
  };

  const renderChoicesForBlank = (b: Blank, blankIdx: number) => (
    <View className="flex-row flex-wrap mt-3">
      {b.choices?.map((c, i) => {
        const chosen = b.selectedChoice === c;
        const correct = normalize(c) === normalize(b.correctText);
        const bg = b.isCorrect != null ? (correct ? "bg-emerald-500" : chosen ? "bg-red-500" : "bg-gray-200 dark:bg-gray-800") : chosen ? "bg-indigo-500" : "bg-gray-100 dark:bg-gray-800";
        return (
          <TouchableOpacity
            key={i}
            className={`px-3 py-2 rounded-lg m-1 ${bg}`}
            onPress={() => !b.isCorrect && handleAnswer(blankIdx, c)}
          >
            <Text className="text-sm font-semibold text-center text-gray-800 dark:text-gray-200">{c}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTypingForBlank = (b: Blank, blankIdx: number) => (
    <View className="mt-3">
      <TextInput
        placeholder="اكتب الكلمة هنا"
        className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-right"
        onSubmitEditing={(ev) => ev.nativeEvent.text && handleAnswer(blankIdx, ev.nativeEvent.text)}
        defaultValue={b.userAnswer}
        returnKeyType="done"
      />
      <View className="flex-row mt-2">
        <TouchableOpacity
          className="bg-indigo-500 px-3 py-2 rounded-lg"
          onPress={() => b.userAnswer && handleAnswer(blankIdx, b.userAnswer)}
        >
          <Text className="text-white font-bold">تحقق</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Total progress
  const totalBlanks = words.length ? words.length : 1;
  const answeredBlanks = blanks.filter((b) => b.isCorrect).length;
  const progressPercent = Math.round((answeredBlanks / totalBlanks) * 100);

  if (loading) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center">
      <ActivityIndicator size="large" />
      <Text className="mt-2 text-gray-600 dark:text-gray-300">تحميل التمرين...</Text>
    </SafeAreaView>
  );

  if (!words.length) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center p-6">
      <Text className="text-center text-lg text-red-600">لا توجد كلمات ضمن هذا النطاق.</Text>
      <TouchableOpacity className="mt-4 bg-indigo-500 px-4 py-2 rounded-lg" onPress={() => router.back()}>
        <Text className="text-white font-bold">عودة</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black p-4">
      <Stack.Screen options={{ title: title }} />
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{title}</Text>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity className={`px-3 py-1 rounded-lg ${mode === "mcq" ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} onPress={() => setMode("mcq")}>
            <Text className={`${mode === "mcq" ? "text-white" : "text-black dark:text-gray-200"}`}>اختيار متعدد</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`px-3 py-1 rounded-lg ${mode === "typing" ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} onPress={() => setMode("typing")}>
            <Text className={`${mode === "typing" ? "text-white" : "text-black dark:text-gray-200"}`}>كتابة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Difficulty & Options Count & Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-700 dark:text-gray-300">مستوى الصعوبة: {difficulty}%</Text>
          <Text className="text-sm text-gray-700 dark:text-gray-300">التقدم الكلي: {progressPercent}%</Text>
        </View>

        <View className="flex-row items-center space-x-2 mb-2">
          <TouchableOpacity
            className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-lg"
            onPress={() => setDifficulty((d) => Math.max(10, d - 10))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <View className="flex-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
            <Text className="text-center text-sm text-gray-600 dark:text-gray-300">{difficulty}%</Text>
          </View>
          <TouchableOpacity
            className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-lg"
            onPress={() => setDifficulty((d) => Math.min(100, d + 10))}
          >
            <Text>+</Text>
          </TouchableOpacity>

          {/* Options count selector */}
          <View className="flex-row items-center space-x-1">
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                className={`px-3 py-1 rounded-lg ${optionsCount === num ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-800"}`}
                onPress={() => setOptionsCount(num)}
              >
                <Text className={`${optionsCount === num ? "text-white" : "text-black dark:text-gray-200"}`}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={`px-3 py-1 rounded-lg ${autoAdvance ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-800"}`}
            onPress={() => setAutoAdvance((s) => !s)}
          >
            <Text className={`${autoAdvance ? "text-white" : "text-black dark:text-gray-200"}`}>Auto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Aya display */}
      <View className="mb-4">{renderAyaWithBlanks()}</View>

      {/* Blanks UI */}
      <ScrollView className="mb-6">
        {blanks.map((b, i) => (
          <View key={i} className="mb-3">
            <Text className="text-right text-sm text-gray-600 dark:text-gray-300 mb-1">
              خانة رقم {i + 1}
            </Text>
            {mode === "mcq" ? renderChoicesForBlank(b, i) : renderTypingForBlank(b, i)}
          </View>
        ))}
      </ScrollView>

      {/* Footer controls */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row space-x-2">
          <TouchableOpacity className="bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-lg" onPress={() => {
            if (currentAyaWordIndexes.length && words.length) {
              const currentAyaNum = words[currentAyaWordIndexes[0]].aya_number;
              const previous = words.filter((w) => w.aya_number < currentAyaNum);
              if (!previous.length) return Alert.alert("بداية النطاق", "أنت في بداية النطاق.");
              const prevAyaNum = previous[previous.length - 1].aya_number;
              const prevIdxs = words.reduce<number[]>((acc, w, idx) => {
                if (w.aya_number === prevAyaNum) acc.push(idx);
                return acc;
              }, []);
              setCurrentAyaWordIndexes(prevIdxs);
              setBlanks([]);
            }
          }}>
            <Text>السابق</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-lg" onPress={() => buildBlanksForCurrentAya()}>
            <Text>إعادة توليد</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-indigo-500 px-3 py-2 rounded-lg" onPress={goToNextAya}>
            <Text className="text-white">التالي</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-red-500 px-3 py-2 rounded-lg"
          onPress={() => Alert.alert("النتيجة", `صحيح: ${score.correct} من ${score.total}`, [
            { text: "حسناً", onPress: () => router.back() },
          ])}
        >
          <Text className="text-white">انهاء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
