// src/hooks/useReviewDetector.ts
import { DueReview, findDueReviewsInRange } from '@/services/data/TrainingQueryService';
import { useCallback, useRef, useState } from 'react';

interface UseReviewDetectorProps {
  startId: number;
  endId: number;
  currentWordId?: number;
  checkInterval?: number; // milliseconds
}

export function useReviewDetector({
  startId,
  endId,
  currentWordId,
  checkInterval = 30000 // Check every 30 seconds
}: UseReviewDetectorProps) {
  const [dueReviews, setDueReviews] = useState<Map<number, DueReview>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  
  const checkIntervalRef = useRef<number | undefined>(undefined);
  const lastCheckTimeRef = useRef<number>(0);

  const checkForDueReviews = useCallback(async (force = false) => {
    // Throttle checks to prevent excessive scanning
    const now = Date.now();
    if (!force && now - lastCheckTimeRef.current < checkInterval) {
      return;
    }

    setIsChecking(true);
    try {
      const reviews = await findDueReviewsInRange(startId, endId);
      const reviewMap = new Map(reviews.map(review => [review.word_id, review]));
      setDueReviews(reviewMap);
      lastCheckTimeRef.current = now;
    } catch (error) {
      console.error('Error checking for due reviews:', error);
    } finally {
      setIsChecking(false);
    }
  }, [startId, endId, checkInterval]);

  const getDueReviewForCurrentWord = useCallback((): DueReview | null => {
    if (!currentWordId) return null;
    return dueReviews.get(currentWordId) || null;
  }, [currentWordId, dueReviews]);

  const getNextDueReview = useCallback((): DueReview | null => {
    if (dueReviews.size === 0) return null;
    
    // Return the first due review (they're sorted by next_review_date)
    return Array.from(dueReviews.values())[0];
  }, [dueReviews]);

  const removeDueReview = useCallback((wordId: number) => {
    setDueReviews(prev => {
      const newMap = new Map(prev);
      newMap.delete(wordId);
      return newMap;
    });
  }, []);

  const startPeriodicChecking = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Perform initial check immediately
    checkForDueReviews(true);

    // Set up periodic interval - use inline function to avoid dependency on checkForDueReviews
    checkIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      if (now - lastCheckTimeRef.current >= checkInterval) {
        setIsChecking(true);
        try {
          const reviews = await findDueReviewsInRange(startId, endId);
          const reviewMap = new Map(reviews.map(review => [review.word_id, review]));
          setDueReviews(reviewMap);
          lastCheckTimeRef.current = now;
        } catch (error) {
          console.error('Error in periodic review check:', error);
        } finally {
          setIsChecking(false);
        }
      }
    }, checkInterval);
  }, [checkInterval, startId, endId, checkForDueReviews]);

  const stopPeriodicChecking = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = undefined;
    }
  }, []);

  return {
    dueReviews,
    isChecking,
    checkForDueReviews,
    getDueReviewForCurrentWord,
    getNextDueReview,
    removeDueReview,
    startPeriodicChecking,
    stopPeriodicChecking,
    hasDueReviews: dueReviews.size > 0
  };
}