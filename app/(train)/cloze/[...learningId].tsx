// app/(train)/cloze/[...learningId].tsx
import { QuranWord, UserProgress } from "@/models/QuranModels";
import { fetchWordsByRange, upsertProgress } from "@/services/data/QuranQueries"; // optional, call safely
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// -----------------------------
// Types
// -----------------------------
type Blank = {
  indexInWords: number;      // index in the flat words[] array
  correctText: string;       // original word text
  userAnswer?: string;       // user typed answer (for typing mode)
  selectedChoice?: string;   // user chosen answer (for MCQ)
  isCorrect?: boolean;
  choices?: string[];        // MCQ options
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

// escape characters trimming to compare answers (normalize)
const normalize = (s?: string) =>
  (s || "")
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF]+/gu, "") // remove punctuation but keep arabic letters
    .trim()
    .toLowerCase();

// -----------------------------
// Component
// -----------------------------
export default function ClozeTrainerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // params passed via Link (strings)
  const startWordId = parseInt(params.startWordId as string);
  const endWordId = parseInt(params.endWordId as string);
  const title = (params.title as string) || "تمرين الحذف (Cloze)";

  // UI / data state
  const [words, setWords] = useState<QuranWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAyaStartIndex, setCurrentAyaStartIndex] = useState<number>(0); // index in words array of current aya start
  const [currentAyaWordIndexes, setCurrentAyaWordIndexes] = useState<number[]>([]); // indexes in words that belong to the current aya
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [mode, setMode] = useState<Mode>("mcq"); // default multiple choice
  const [difficulty, setDifficulty] = useState<number>(30); // percent blanks (10-100)
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Load words
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchWordsByRange(startWordId, endWordId);
        if (!mounted) return;
        setWords(data || []);
        // initialize to first aya if available
        if (data && data.length > 0) {
          const firstAya = data[0].aya_number;
          const idxs = data.reduce<number[]>((acc, w, idx) => {
            if (w.aya_number === firstAya) acc.push(idx);
            return acc;
          }, []);
          setCurrentAyaStartIndex(0);
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
    return () => {
      mounted = false;
    };
  }, [startWordId, endWordId]);

  // derived: pool of candidate words for distractors (unique normalized words)
  const wordPool = useMemo(() => {
    const pool = Array.from(new Set(words.map((w) => w.text))).filter(Boolean);
    return pool;
  }, [words]);

  // Helper: build blanks for the currently shown aya(s)
  const buildBlanksForCurrentAya = (forceIndexes?: number[]) => {
    // select which words in currentAyaWordIndexes will be blanks based on difficulty
    const ayaWordIdxs = forceIndexes ?? currentAyaWordIndexes;
    if (!ayaWordIdxs || ayaWordIdxs.length === 0) {
      setBlanks([]);
      return;
    }

    // number of blanks depends on difficulty percentage
    const maxBlanks = ayaWordIdxs.length;
    // difficulty percent -> number of blanks (rounded)
    const target = Math.max(1, Math.round((difficulty / 100) * maxBlanks));

    // Choose evenly spaced or random indexes for blanks
    const chosenIdxs = sample(ayaWordIdxs, Math.min(target, ayaWordIdxs.length));

    const newBlanks: Blank[] = chosenIdxs.map((wordIdx) => {
      const correct = words[wordIdx].text;
      // prepare multiple choices: correct + distractors
      const complements = wordPool.filter((w) => normalize(w) !== normalize(correct));
      const distractors = sample(complements, 5); // take up to 5 candidates and we'll slice later
      const choices = shuffle([correct, ...distractors]).slice(0, 4); // default 4 options
      return {
        indexInWords: wordIdx,
        correctText: correct,
        choices,
      };
    });

    // initialize score counters for this aya
    setScore((s) => ({ ...s, total: newBlanks.length }));
    setBlanks(newBlanks);
  };

  // Trigger rebuild when aya changes or difficulty/mode changes
  useEffect(() => {
    if (currentAyaWordIndexes.length > 0 && words.length > 0) {
      buildBlanksForCurrentAya();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyaWordIndexes, difficulty, words]);

  // Helper to move to next aya
  const goToNextAya = () => {
    if (!words || words.length === 0) return;
    // find next aya number after currentAyaWordIndexes
    const currentAyaNum = words[currentAyaWordIndexes[0]].aya_number;
    const remaining = words.filter((w) => w.aya_number > currentAyaNum);
    if (remaining.length === 0) {
      Alert.alert("انتهت الآيات", "لقد وصلت إلى نهاية النطاق.");
      return;
    }
    const nextAyaNum = remaining[0].aya_number;
    const nextIdxs = words.reduce<number[]>((acc, w, idx) => {
      if (w.aya_number === nextAyaNum) acc.push(idx);
      return acc;
    }, []);
    setCurrentAyaWordIndexes(nextIdxs);
    setBlanks([]);
  };

  const goToPrevAya = () => {
    if (!words || words.length === 0) return;
    const currentAyaNum = words[currentAyaWordIndexes[0]].aya_number;
    const previous = words.filter((w) => w.aya_number < currentAyaNum);
    if (previous.length === 0) {
      Alert.alert("بداية النطاق", "أنت في بداية النطاق.");
      return;
    }
    // find last aya number < current
    const prevAyaNum = previous[previous.length - 1].aya_number;
    const prevIdxs = words.reduce<number[]>((acc, w, idx) => {
      if (w.aya_number === prevAyaNum) acc.push(idx);
      return acc;
    }, []);
    setCurrentAyaWordIndexes(prevIdxs);
    setBlanks([]);
  };

  // When user answers a blank (either mcq or typing)
  const handleAnswer = async (blankIdx: number, answer: string) => {
    setBlanks((prev) =>
      prev.map((b, i) =>
        i === blankIdx ? { ...b, userAnswer: answer, selectedChoice: answer } : b
      )
    );

    const theBlank = blanks[blankIdx];
    const correct = normalize(theBlank.correctText);
    const given = normalize(answer);
    const isCorrect = correct === given;

    // update blank correctness
    setBlanks((prev) =>
      prev.map((b, i) => (i === blankIdx ? { ...b, isCorrect } : b))
    );

    // update score
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total }));

    // optional: update SRS progress for each word (best-effort)
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
        };
        // call upsertProgress but don't block UI on it
        upsertProgress(progress).catch(() => {});
      }
    } catch {
      // ignore SRS errors
    }

    // Auto-advance behavior: if all blanks answered or this blank correct then optionally move focus / next blank
    const remainingUnanswered = blanks.filter((b) => !b.isCorrect);
    if (autoAdvance && isCorrect) {
      // focus next unanswered blank: we'll mark and if none remain, advance to next aya after a short delay
      const nextUn = remainingUnanswered.length > 0 ? remainingUnanswered[0] : null;
      if (!nextUn) {
        // all done for current aya
        setTimeout(() => {
          goToNextAya();
        }, 600);
      }
    }
  };

  // render the current aya as text with blanks replaced by placeholders
  const renderAyaWithBlanks = () => {
    if (!words || words.length === 0) return null;
    const fragment: (string | { blankIndex: number; placeholder: string })[] = [];

    // Build map from index to blank order index
    const idxToBlankIndex: Record<number, number> = {};
    blanks.forEach((b, i) => (idxToBlankIndex[b.indexInWords] = i));

    currentAyaWordIndexes.forEach((wIdx) => {
      const w = words[wIdx];
      const blankIdx = idxToBlankIndex[wIdx];
      if (blankIdx !== undefined) {
        fragment.push({ blankIndex: blankIdx, placeholder: "____" });
      } else {
        fragment.push(w.text);
      }
    });

    // Convert fragment to React nodes with right-to-left formatting
    return (
      <View className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        <Text className="text-right text-2xl font-uthmanic leading-loose text-gray-900 dark:text-gray-100">
          {fragment.map((part, idx) =>
            typeof part === "string" ? (
              <Text key={idx} style={{ writingDirection: "rtl" }}>
                {part + " "}
              </Text>
            ) : (
              <Text
                key={idx}
                className="text-center px-2"
                style={{ textDecorationLine: "underline", writingDirection: "rtl" }}
              >
                {part.placeholder + " "}
              </Text>
            )
          )}
        </Text>
      </View>
    );
  };

  // UI: render choices for each blank (MCQ)
  const renderChoicesForBlank = (b: Blank, blankIdx: number) => {
    const choices = b.choices ?? [];
    return (
      <View className="flex-row flex-wrap mt-3">
        {choices.map((c, i) => {
          const chosen = b.selectedChoice === c;
          const correct = normalize(c) === normalize(b.correctText);
          const bg =
            b.isCorrect != null
              ? correct
                ? "bg-emerald-500"
                : chosen
                ? "bg-red-500"
                : "bg-gray-200"
              : chosen
              ? "bg-indigo-500"
              : "bg-gray-100";

          return (
            <TouchableOpacity
              key={i}
              className={`px-3 py-2 rounded-lg m-1 ${bg}`}
              onPress={() => {
                if (b.isCorrect) return;
                handleAnswer(blankIdx, c);
              }}
            >
              <Text className="text-sm font-semibold text-center text-white">
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // UI: typing input for a blank
  const renderTypingForBlank = (b: Blank, blankIdx: number) => {
    return (
      <View className="mt-3">
        <TextInput
          placeholder="اكتب الكلمة هنا"
          className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-right"
          onSubmitEditing={(ev) => {
            const text = ev.nativeEvent.text;
            if (!text) return;
            handleAnswer(blankIdx, text);
          }}
          defaultValue={b.userAnswer}
          returnKeyType="done"
        />
        <View className="flex-row mt-2">
          <TouchableOpacity
            className="bg-indigo-500 px-3 py-2 rounded-lg"
            onPress={() => {
              if (!b.userAnswer) return;
              handleAnswer(blankIdx, b.userAnswer || "");
            }}
          >
            <Text className="text-white font-bold">تحقق</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main render
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600 dark:text-gray-300">تحميل التمرين...</Text>
      </SafeAreaView>
    );
  }

  if (!words || words.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black justify-center items-center p-6">
        <Text className="text-center text-lg text-red-600">لا توجد كلمات ضمن هذا النطاق.</Text>
        <TouchableOpacity
          className="mt-4 bg-indigo-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">عودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{title}</Text>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            className={`px-3 py-1 rounded-lg ${mode === "mcq" ? "bg-indigo-600" : "bg-gray-200"}`}
            onPress={() => setMode("mcq")}
          >
            <Text className={`${mode === "mcq" ? "text-white" : "text-black"}`}>اختيار متعدد</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-3 py-1 rounded-lg ${mode === "typing" ? "bg-indigo-600" : "bg-gray-200"}`}
            onPress={() => setMode("typing")}
          >
            <Text className={`${mode === "typing" ? "text-white" : "text-black"}`}>كتابة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-700 dark:text-gray-300">مستوى الصعوبة: {difficulty}%</Text>
          <Text className="text-sm text-gray-700 dark:text-gray-300">التقدم: {score.correct}/{score.total}</Text>
        </View>

        <View className="flex-row items-center mt-2 space-x-2">
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

          <TouchableOpacity
            className={`px-3 py-1 rounded-lg ${autoAdvance ? "bg-emerald-500" : "bg-gray-200"}`}
            onPress={() => setAutoAdvance((s) => !s)}
          >
            <Text className={`${autoAdvance ? "text-white" : "text-black"}`}>Auto</Text>
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
          <TouchableOpacity className="bg-gray-200 px-3 py-2 rounded-lg" onPress={goToPrevAya}>
            <Text>السابق</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-gray-200 px-3 py-2 rounded-lg" onPress={() => buildBlanksForCurrentAya()}>
            <Text>إعادة توليد</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-indigo-500 px-3 py-2 rounded-lg" onPress={goToNextAya}>
            <Text className="text-white">التالي</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-red-500 px-3 py-2 rounded-lg"
          onPress={() => {
            // quick finish action: show score and go back
            Alert.alert("النتيجة", `صحيح: ${score.correct} من ${score.total}`, [
              { text: "حسناً", onPress: () => router.back() },
            ]);
          }}
        >
          <Text className="text-white">انهاء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
