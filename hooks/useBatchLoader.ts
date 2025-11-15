// src/hooks/useBatchLoader.ts
import { WordWithProgress, fetchWordsWithProgressBatch, findDueReviewsInRange } from '@/services/data/TrainingQueryService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseBatchLoaderProps {
  startId: number;
  endId: number;
  batchSize?: number;
}

export function useBatchLoader({ startId, endId, batchSize = 20 }: UseBatchLoaderProps) {
  const [words, setWords] = useState<WordWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dueReviews, setDueReviews] = useState<Map<number, string>>(new Map());
  
  const currentOffset = useRef(0);
  const loadedWordIds = useRef<Set<number>>(new Set());
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadInitialBatch = useCallback(async () => {
    if (isNaN(startId) || isNaN(endId) || startId > endId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Reset state
      setWords([]);
      loadedWordIds.current.clear();
      currentOffset.current = 0;
      setHasMore(true);

      // Load due reviews for the entire range
      try {
        const reviews = await findDueReviewsInRange(startId, endId);
        const reviewMap = new Map(reviews.map(r => [r.word_id, r.word_text]));
        if (isMounted.current) {
          setDueReviews(reviewMap);
        }
      } catch (error) {
        console.error('Error loading due reviews:', error);
        // Continue without due reviews
      }
      
      // Load first batch of words
      const firstBatch = await fetchWordsWithProgressBatch(startId, endId, batchSize, 0);
      
      if (!isMounted.current) return;

      // Track loaded word IDs to avoid duplicates
      firstBatch.forEach(word => loadedWordIds.current.add(word.id));
      setWords(firstBatch);
      currentOffset.current = batchSize;
      
      // Check if there are more words to load
      const hasMoreData = firstBatch.length === batchSize && (currentOffset.current + startId) <= endId;
      setHasMore(hasMoreData);

    } catch (error) {
      console.error('Error loading initial batch:', error);
      if (isMounted.current) {
        setHasMore(false);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [startId, endId, batchSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    
    setLoadingMore(true);
    try {
      const nextBatch = await fetchWordsWithProgressBatch(
        startId, 
        endId, 
        batchSize, 
        currentOffset.current
      );
      
      if (!isMounted.current) return;

      if (nextBatch.length === 0) {
        setHasMore(false);
        return;
      }

      // Filter out any duplicates
      const newWords = nextBatch.filter(word => !loadedWordIds.current.has(word.id));
      
      if (newWords.length === 0) {
        setHasMore(false);
        return;
      }

      newWords.forEach(word => loadedWordIds.current.add(word.id));
      
      setWords(prev => [...prev, ...newWords]);
      currentOffset.current += batchSize;
      
      // Update hasMore flag
      const hasMoreData = newWords.length === batchSize && (currentOffset.current + startId) <= endId;
      setHasMore(hasMoreData);

    } catch (error) {
      console.error('Error loading more words:', error);
      if (isMounted.current) {
        setHasMore(false);
      }
    } finally {
      if (isMounted.current) {
        setLoadingMore(false);
      }
    }
  }, [startId, endId, batchSize, loadingMore, hasMore, loading]);

  const addWord = useCallback((word: WordWithProgress) => {
    if (!loadedWordIds.current.has(word.id)) {
      loadedWordIds.current.add(word.id);
      setWords(prev => [word, ...prev]);
    }
  }, []);

  const reset = useCallback(() => {
    setWords([]);
    setDueReviews(new Map());
    loadedWordIds.current.clear();
    currentOffset.current = 0;
    setHasMore(true);
    setLoading(true);
    loadInitialBatch();
  }, [loadInitialBatch]);

  // Load initial batch on mount
  useEffect(() => {
    loadInitialBatch();
  }, [loadInitialBatch]);

  return {
    words,
    loading,
    loadingMore,
    hasMore,
    dueReviews,
    loadMore,
    loadInitialBatch,
    addWord,
    reset,
  };
}