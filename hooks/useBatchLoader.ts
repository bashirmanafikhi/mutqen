// src/hooks/useBatchLoader.ts
import { WordWithProgress, fetchWordsWithProgressBatch, findDueReviewsInRange } from '@/services/data/TrainingQueryService';
import { useCallback, useRef, useState } from 'react';

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
  const [dueReviews, setDueReviews] = useState<Map<number, string>>(new Map()); // word_id -> word_text
  
  const currentOffset = useRef(0);
  const loadedWordIds = useRef<Set<number>>(new Set());

  const loadInitialBatch = useCallback(async () => {
    if (isNaN(startId) || isNaN(endId)) return;
    
    setLoading(true);
    try {
      // Load due reviews for the entire range
      const reviews = await findDueReviewsInRange(startId, endId);
      const reviewMap = new Map(reviews.map(r => [r.word_id, r.word_text]));
      setDueReviews(reviewMap);
      
      // Load first batch of words
      const firstBatch = await fetchWordsWithProgressBatch(startId, endId, batchSize, 0);
      
      // Track loaded word IDs to avoid duplicates
      firstBatch.forEach(word => loadedWordIds.current.add(word.id));
      setWords(firstBatch);
      currentOffset.current = batchSize;
      
      // Check if there are more words to load
      setHasMore(firstBatch.length === batchSize && currentOffset.current + startId <= endId);
    } catch (error) {
      console.error('Error loading initial batch:', error);
    } finally {
      setLoading(false);
    }
  }, [startId, endId, batchSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextBatch = await fetchWordsWithProgressBatch(
        startId, 
        endId, 
        batchSize, 
        currentOffset.current
      );
      
      // Filter out any duplicates
      const newWords = nextBatch.filter(word => !loadedWordIds.current.has(word.id));
      newWords.forEach(word => loadedWordIds.current.add(word.id));
      
      setWords(prev => [...prev, ...newWords]);
      currentOffset.current += batchSize;
      
      // Update hasMore flag
      setHasMore(newWords.length === batchSize && currentOffset.current + startId <= endId);
    } catch (error) {
      console.error('Error loading more words:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [startId, endId, batchSize, loadingMore, hasMore]);

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