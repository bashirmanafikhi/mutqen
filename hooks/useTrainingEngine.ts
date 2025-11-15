// src/hooks/useTrainingEngine.ts - UPDATED
import { UserProgress } from '@/models/QuranModels';
import { TrainingState, TrainingStats } from '@/models/TrainingModels';
import { WordWithProgress, fetchWordById, findFirstUnlearnedWord, hasMoreDueReviews } from '@/services/data/TrainingQueryService';
import { upsertProgressDb } from '@/services/data/userProgressQueries';
import { getUpdatedProgress } from '@/services/SpacedRepetitionService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTrainingEngineProps {
  startId: number;
  endId: number;
  words: WordWithProgress[];
  dueReviews: Map<number, string>;
  onLoadMore: () => void;
  hasMoreWords: boolean;
  onAddWord?: (word: WordWithProgress) => void;
}

export function useTrainingEngine({
  startId,
  endId,
  words,
  dueReviews,
  onLoadMore,
  hasMoreWords,
  onAddWord
}: UseTrainingEngineProps) {
  const [state, setState] = useState<TrainingState>({
    mode: 'memorization',
    currentWordIndex: 0,
    words: [],
    revealedWords: [],
    dueReviews: new Map(),
    isAtCanStop: false,
    hasMoreDueReviews: false
  });

  const [stats, setStats] = useState<TrainingStats>({
    totalWords: 0,
    wordsReviewed: 0,
    wordsMemorized: 0,
    currentStreak: 0,
    accuracy: 100,
    sessionStartTime: new Date()
  });

  const currentStreakRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const totalAnswersRef = useRef(0);
  const restartCounterRef = useRef(0);

  // Initialize training state when words change
  useEffect(() => {
    if (words.length > 0) {
      setState(prev => {
        // Always reset on initial load (when words were empty)
        // OR when we're transitioning from a finished state (restart scenario)
        const isInitialLoad = prev.words.length === 0;
        const isRestarting = prev.currentWordIndex >= prev.words.length && prev.revealedWords.length > 0 && words.length > 0;
        
        if (isInitialLoad || isRestarting) {
          return {
            ...prev,
            words,
            dueReviews,
            currentWordIndex: 0,
            revealedWords: [],
            mode: 'memorization'
          };
        }
        
        // Append new words without resetting UI state (batch loading scenario)
        return {
          ...prev,
          words,
          dueReviews
        };
      });
    }
  }, [words, dueReviews]);

  // Check for due reviews and can-stop boundaries
  useEffect(() => {
    const checkTrainingState = async () => {
      const currentWord = state.words[state.currentWordIndex];
      if (!currentWord) return;

      // Check if current word is at can-stop boundary
      const isAtCanStop = currentWord.can_stop || false;

      // Check if there are more due reviews ahead
      const moreDueReviews = await hasMoreDueReviews(currentWord.id, endId);

      setState(prev => ({
        ...prev,
        isAtCanStop,
        hasMoreDueReviews: moreDueReviews
      }));
    };

    checkTrainingState();
  }, [state.currentWordIndex, state.words, dueReviews, endId]);

  // Auto-load more words when approaching end of current batch
  useEffect(() => {
    if (hasMoreWords && state.currentWordIndex >= state.words.length - 5) {
      onLoadMore();
    }
  }, [state.currentWordIndex, state.words.length, hasMoreWords, onLoadMore]);

  const getCurrentWord = useCallback((): WordWithProgress | null => {
    return state.words[state.currentWordIndex] || null;
  }, [state.words, state.currentWordIndex]);

  const getRevealedWords = useCallback((): WordWithProgress[] => {
    return state.revealedWords;
  }, [state.revealedWords]);

  // ADD THIS METHOD: Restart session
  const restartSession = useCallback(() => {
    restartCounterRef.current += 1;
    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      revealedWords: [],
      mode: 'memorization'
    }));

    setStats({
      totalWords: 0,
      wordsReviewed: 0,
      wordsMemorized: 0,
      currentStreak: 0,
      accuracy: 100,
      sessionStartTime: new Date()
    });

    currentStreakRef.current = 0;
    correctAnswersRef.current = 0;
    totalAnswersRef.current = 0;
  }, []);

  const updateProgress = useCallback(async (quality: number) => {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    try {
      // Prepare current progress data
      const currentProgress: UserProgress | null = currentWord.current_interval !== undefined ? {
        word_id: currentWord.id,
        current_interval: currentWord.current_interval,
        review_count: currentWord.review_count || 0,
        lapses: currentWord.lapses || 0,
        ease_factor: currentWord.ease_factor || 2.5,
        next_review_date: currentWord.next_review_date || new Date().toISOString(),
        last_review_date: currentWord.last_review_date || new Date().toISOString(),
        last_successful_date: currentWord.last_successful_date,
        memory_tier: currentWord.memory_tier || 0,
        notes: currentWord.notes,
        created_at: new Date().toISOString(),
      } : null;

      // Update progress using spaced repetition algorithm
      const updatedProgress = getUpdatedProgress(currentProgress, quality);
      await upsertProgressDb(updatedProgress);

      // Update stats
      const isCorrect = quality >= 3;
      totalAnswersRef.current += 1;
      if (isCorrect) {
        correctAnswersRef.current += 1;
        currentStreakRef.current += 1;
      } else {
        currentStreakRef.current = 0;
      }

      const accuracy = totalAnswersRef.current > 0
        ? Math.round((correctAnswersRef.current / totalAnswersRef.current) * 100)
        : 100;

      setStats(prev => ({
        ...prev,
        wordsReviewed: prev.wordsReviewed + 1,
        wordsMemorized: isCorrect ? prev.wordsMemorized + 1 : prev.wordsMemorized,
        currentStreak: currentStreakRef.current,
        accuracy
      }));

      // Add to revealed words (avoid duplicates) and move to next word
      setState(prev => {
        const alreadyRevealed = prev.revealedWords.some(w => w.id === currentWord.id);
        return {
          ...prev,
          revealedWords: alreadyRevealed ? prev.revealedWords : [...prev.revealedWords, currentWord],
          currentWordIndex: prev.currentWordIndex + 1
        };
      });

      // Remove from due reviews if it was there
      if (state.dueReviews.has(currentWord.id)) {
        const newDueReviews = new Map(state.dueReviews);
        newDueReviews.delete(currentWord.id);
        setState(prev => ({ ...prev, dueReviews: newDueReviews }));
      }

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [getCurrentWord, state.dueReviews]);

  const jumpToReview = useCallback(async (wordId: number) => {
    const reviewIndex = state.words.findIndex(word => word.id === wordId);
    if (reviewIndex !== -1) {
      setState(prev => ({
        ...prev,
        currentWordIndex: reviewIndex,
        mode: 'review',
        showReviewAlert: false,
        reviewAlertWordId: undefined
      }));
    } else {
      // If review word not in current batch, we need to load it
      // This would require additional logic to fetch specific word
      console.log('Review word not in current batch, need to implement loading');
    }
  }, [state.words]);

  /**
   * Jump to a review word and show context (previous words) for orientation
   * This helps the user see where they are in the text
   */
    const jumpToReviewWithContext = useCallback(async (wordId: number, contextSize: number = 3) => {
      let reviewIndex = state.words.findIndex(word => word.id === wordId);

      // If word not in current batch, fetch it
      if (reviewIndex === -1) {
        const word = await fetchWordById(wordId);
        if (word) {
          // Ask batch loader to add it (if provided)
          onAddWord?.(word);

          // Update local state but avoid adding duplicates if batch loader already added it
          setState(prev => {
            const exists = prev.words.some(w => w.id === word.id);
            if (exists) {
              const idx = prev.words.findIndex(w => w.id === word.id);
              return {
                ...prev,
                currentWordIndex: idx,
                revealedWords: [],
                mode: 'review'
              };
            }

            const newWords = [...prev.words, word];
            const newIndex = newWords.length - 1;
            return {
              ...prev,
              words: newWords,
              currentWordIndex: newIndex,
              revealedWords: [],
              mode: 'review'
            };
          });
        } else {
          console.error(`Could not fetch review word ${wordId}`);
        }
        return;
      }

      // Calculate context start - show N words before the review word
      const contextStart = Math.max(0, reviewIndex - contextSize);

      // Pre-reveal words before the target word for context
      const contextWords = state.words.slice(contextStart, reviewIndex);

      setState(prev => {
        // Append only context words that are not already revealed
        const existingIds = new Set(prev.revealedWords.map(w => w.id));
        const toAdd = contextWords.filter(w => !existingIds.has(w.id));

        return {
          ...prev,
          currentWordIndex: reviewIndex,
          // Clear previous revealed words and show only the context for the review
          revealedWords: toAdd.length > 0 ? [...toAdd] : [],
          mode: 'review'
        };
      });
    }, [state.words, onAddWord]);

  const continueMemorization = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'memorization',
      revealedWords: []
    }));
  }, []);

  /**
   * Jump to the latest saved word in memorization mode
   * Helps users resume from where they left off
   */
  const jumpToLatestSaved = useCallback(async (startId: number, endId: number) => {
    // Find the first word in the currently loaded batch that does NOT have progress
    const firstUnlearnedIndex = state.words.findIndex(w => (w.memory_tier === undefined || w.memory_tier === 0) && !w.last_review_date);

    if (firstUnlearnedIndex !== -1) {
      setState(prev => ({
        ...prev,
        currentWordIndex: firstUnlearnedIndex,
        mode: 'memorization',
        revealedWords: []
      }));
      return;
    }

    // If none found in the current batch, search DB for the next unlearned word in range
    try {
      const unlearned = await findFirstUnlearnedWord(startId, endId);
      if (unlearned) {
        // Ask batch loader to add if available
        onAddWord?.(unlearned);

        // Ensure we set currentWordIndex to the injected word
        setState(prev => {
          const exists = prev.words.some(w => w.id === unlearned.id);
          if (exists) {
            const idx = prev.words.findIndex(w => w.id === unlearned.id);
            return {
              ...prev,
              currentWordIndex: idx,
              mode: 'memorization',
              revealedWords: []
            };
          }

          const newWords = [...prev.words, unlearned];
          const newIndex = newWords.length - 1;
          return {
            ...prev,
            words: newWords,
            currentWordIndex: newIndex,
            mode: 'memorization',
            revealedWords: []
          };
        });
      } else {
        console.info('All words in this batch have progress, not navigating.');
      }
    } catch (error) {
      console.error('Error while searching for unlearned word in DB:', error);
    }
  }, [state.words]);

  const switchToReviewMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'review',
      revealedWords: []
    }));
  }, []);

  const canContinue = useCallback((): boolean => {
    return state.currentWordIndex < state.words.length - 1;
  }, [state.currentWordIndex, state.words.length]);

  const isFinished = useCallback((): boolean => {
    return state.currentWordIndex >= state.words.length && state.words.length > 0;
  }, [state.currentWordIndex, state.words.length]);

  return {
    // State
    state,
    stats,

    // Current word info
    currentWord: getCurrentWord(),
    revealedWords: getRevealedWords(),
    hasMoreWords: state.currentWordIndex < state.words.length - 1,

    // Actions
    updateProgress,
    jumpToReview,
    jumpToReviewWithContext,
    jumpToLatestSaved,
    continueMemorization,
    switchToReviewMode,
    restartSession,

    // Status checks
    canContinue: canContinue(),
    isFinished: isFinished(),
    hasDueReviews: state.dueReviews.size > 0
  };
}