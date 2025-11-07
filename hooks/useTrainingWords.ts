// hooks/useTrainingWords.ts
import { QuranWord, WordCard } from '@/models/QuranModels';
import { fetchWordsByRange } from '@/services/data/QuranQueries';
import { fetchProgressByWordIdDb, getUpdatedProgress, upsertProgressDb } from '@/services/SpacedRepetitionService';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

export function useTrainingWords(startWordId: number, endWordId: number) {
  const [allWords, setAllWords] = useState<WordCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWords = useCallback(async () => {
    if (isNaN(startWordId) || isNaN(endWordId)) {
      Alert.alert('خطأ', 'لم يتم تمرير معرّفات الكلمات بشكل صحيح.');
      return;
    }

    setIsLoading(true);
    try {
      const rawWords: QuranWord[] = await fetchWordsByRange(startWordId, endWordId);
      const mapped: WordCard[] = rawWords.map((word, index, arr) => {
        const prev = arr[index - 1];
        return {
          ...word,
          isRevealed: false,
          progressStatus: 'hidden',
          suraName: `سورة ${word.sura_id}`,
          isFirstAyaWord: prev ? prev.aya_number !== word.aya_number : true,
          isFirstSuraWord: index === 0,
        };
      });
      setAllWords(mapped);
    } catch (error) {
      console.error('Failed to load words:', error);
      Alert.alert('خطأ', 'فشل تحميل كلمات المحفوظ.');
    } finally {
      setIsLoading(false);
    }
  }, [startWordId, endWordId]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const revealedWords = useMemo(() => allWords.filter(w => w.isRevealed), [allWords]);
  const hiddenWords = useMemo(() => allWords.filter(w => !w.isRevealed), [allWords]);

  const updateProgress = useCallback(async (wordId: number, quality: number, status: 'correct' | 'incorrect') => {
    try {
      const current = await fetchProgressByWordIdDb(wordId);
      const updated = getUpdatedProgress(current, quality);
      updated.word_id = wordId;
      await upsertProgressDb(updated);
      setAllWords(prev => prev.map(w => w.id === wordId ? { ...w, isRevealed: true, progressStatus: status } : w));
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  }, []);

  const restart = () => {
    setAllWords(prev => prev.map(w => ({ ...w, isRevealed: false, progressStatus: 'hidden' })));
  };

  return { allWords, revealedWords, hiddenWords, isLoading, updateProgress, restart };
}
