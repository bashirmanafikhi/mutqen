// src/hooks/useTrainingSession.ts - FIXED VERSION
import { getRangeStartingPoint } from '@/services/data/TrainingQueryService';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize with proper starting point considering can-stop boundaries
  useEffect(() => {
    const initializeStartingPoint = async () => {
      if (isNaN(startId) || isNaN(endId) || startId > endId) {
        if (isMounted.current) {
          setIsInitializing(false);
        }
        return;
      }

      setIsInitializing(true);
      try {
        const startingPoint = await getRangeStartingPoint(startId, endId);
        if (isMounted.current) {
          setActualStartId(startingPoint);
        }
      } catch (error) {
        console.error('Error initializing starting point:', error);
        if (isMounted.current) {
          setActualStartId(startId);
        }
      } finally {
        if (isMounted.current) {
          setIsInitializing(false);
        }
      }
    };

    initializeStartingPoint();
  }, [startId, endId]);

  // Batch loading for words - only start when we have the actual start ID
  const batchLoader = useBatchLoader({
    startId: actualStartId,
    endId,
    batchSize
  });

  // Review detection - only start when we have words
  const reviewDetector = useReviewDetector({
    startId: actualStartId,
    endId,
    currentWordId: batchLoader.words[0]?.id
  });

  // Training engine - only start when we have words
  const trainingEngine = useTrainingEngine({
    startId: actualStartId,
    endId,
    words: batchLoader.words,
    dueReviews: batchLoader.dueReviews,
    onLoadMore: batchLoader.loadMore,
     hasMoreWords: batchLoader.hasMore,
     onAddWord: batchLoader.addWord
  });

  // FIX: Add proper dependencies to prevent infinite loop
  useEffect(() => {
    if (!isInitializing && !batchLoader.loading && batchLoader.words.length > 0) {
      reviewDetector.startPeriodicChecking();
    }

    return () => {
      reviewDetector.stopPeriodicChecking();
    };
  }, [isInitializing, batchLoader.loading, batchLoader.words.length, reviewDetector.startPeriodicChecking, reviewDetector.stopPeriodicChecking]); // ADD THESE DEPENDENCIES

  const restartSession = useCallback(() => {
    batchLoader.reset();
    reviewDetector.checkForDueReviews(true);
  }, [batchLoader, reviewDetector]);

  // Combined loading state
  const isLoading = isInitializing || batchLoader.loading;

  return {
    // State
    isInitializing: isLoading,
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