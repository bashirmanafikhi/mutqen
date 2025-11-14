// src/hooks/useTrainingSession.ts
import { getRangeStartingPoint } from '@/services/data/TrainingQueryService';
import { useCallback, useEffect, useState } from 'react';
import { useBatchLoader } from './useBatchLoader';
import { useReviewDetector } from './useReviewDetector';
import { useTrainingEngine } from './useTrainingEngine';

interface UseTrainingSessionProps {
  startId: number;
  endId: number;
  batchSize?: number;
}

export function useTrainingSession({
  startId,
  endId,
  batchSize = 20
}: UseTrainingSessionProps) {
  const [actualStartId, setActualStartId] = useState<number>(startId);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize with proper starting point considering can-stop boundaries
  useEffect(() => {
    const initializeStartingPoint = async () => {
      setIsInitializing(true);
      try {
        const startingPoint = await getRangeStartingPoint(startId, endId);
        setActualStartId(startingPoint);
      } catch (error) {
        console.error('Error initializing starting point:', error);
        setActualStartId(startId);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStartingPoint();
  }, [startId, endId]);

  // Batch loading for words
  const batchLoader = useBatchLoader({
    startId: actualStartId,
    endId,
    batchSize
  });

  // Review detection
  const reviewDetector = useReviewDetector({
    startId: actualStartId,
    endId,
    currentWordId: batchLoader.words[0]?.id // Use first word as current for detection
  });

  // Training engine
  const trainingEngine = useTrainingEngine({
    startId: actualStartId,
    endId,
    words: batchLoader.words,
    dueReviews: new Map(Array.from(reviewDetector.dueReviews).map(([id, review]) => [id, review.word_text])),
    onLoadMore: batchLoader.loadMore,
    hasMoreWords: batchLoader.hasMore
  });

  // Start periodic review checking when session begins
  useEffect(() => {
    if (!isInitializing && batchLoader.words.length > 0) {
      reviewDetector.startPeriodicChecking();
    }

    return () => {
      reviewDetector.stopPeriodicChecking();
    };
  }, [isInitializing, batchLoader.words.length, reviewDetector]);

  // Update review detector with current word
  useEffect(() => {
    if (trainingEngine.currentWord) {
      // The review detector will use this to check for current word reviews
      // This is handled internally by the training engine
    }
  }, [trainingEngine.currentWord]);

  const restartSession = useCallback(() => {
    batchLoader.reset();
    reviewDetector.checkForDueReviews(true);
  }, [batchLoader, reviewDetector]);

  return {
    // State
    isInitializing: isInitializing || batchLoader.loading,
    actualStartId,
    
    // Batch loading
    words: batchLoader.words,
    loadingMore: batchLoader.loadingMore,
    //hasMoreWords: batchLoader.hasMore,
    
    // Training engine
    ...trainingEngine,
    
    // Review detection
    reviewDetector,
    
    // Actions
    restartSession,
    loadMoreWords: batchLoader.loadMore
  };
}