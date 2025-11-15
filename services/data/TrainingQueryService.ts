// src/services/TrainingQueryService.ts
import { quran_suras, quran_words, user_progress } from '@/db/schema';
import { and, asc, between, desc, eq, gt, gte, lte, sql } from 'drizzle-orm';
import { getDrizzleDb } from '../DrizzleConnection';

export interface WordWithProgress {
  id: number;
  sura_id: number;
  aya_number: number;
  page_id: number;
  text: string;
  is_end_of_aya: boolean;
  can_stop: boolean;
  sura_name: string;
  
  // Progress fields (nullable for words without progress)
  current_interval?: number;
  review_count?: number;
  lapses?: number;
  ease_factor?: number;
  next_review_date?: string;
  last_review_date?: string;
  last_successful_date?: string | null;
  memory_tier?: number;
  notes?: string | null;
}

export interface DueReview {
  word_id: number;
  word_text: string;
  sura_name: string;
  aya_number: number;
}

/**
 * Fetches words with progress data in batches with efficient joins
 * Always returns all words in the range for sequential training
 */
export async function fetchWordsWithProgressBatch(
  startId: number,
  endId: number,
  limit: number = 50,
  offset: number = 0
): Promise<WordWithProgress[]> {
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      const db = await getDrizzleDb();
      
      const data = await db
        .select({
          // Word fields
          id: quran_words.id,
          sura_id: quran_words.sura_id,
          aya_number: quran_words.aya_number,
          page_id: quran_words.page_id,
          text: quran_words.text,
          is_end_of_aya: quran_words.is_end_of_aya,
          can_stop: quran_words.can_stop,
          sura_name: quran_suras.name,
          
          // Progress fields (nullable)
          current_interval: user_progress.current_interval,
          review_count: user_progress.review_count,
          lapses: user_progress.lapses,
          ease_factor: user_progress.ease_factor,
          next_review_date: user_progress.next_review_date,
          last_review_date: user_progress.last_review_date,
          last_successful_date: user_progress.last_successful_date,
          memory_tier: user_progress.memory_tier,
          notes: user_progress.notes,
        })
        .from(quran_words)
        .leftJoin(user_progress, eq(quran_words.id, user_progress.word_id))
        .leftJoin(quran_suras, eq(quran_words.sura_id, quran_suras.id))
        .where(
          between(quran_words.id, startId, endId)
        )
        .orderBy(
          // Order by word ID in sequence for Quranic order
          asc(quran_words.id)
        )
        .limit(limit)
        .offset(offset);

      return data as WordWithProgress[];
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error('Error fetching words with progress batch (final attempt):', error);
        return []; // Return empty array instead of throwing
      }
      console.warn(`Error fetching words batch, retrying (${retries}/${maxRetries}):`, error);
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 100 * retries));
    }
  }
  
  return [];
}

/**
 * Finds due reviews across the entire range (for review alerts)
 */
export async function findDueReviewsInRange(
  startId: number, 
  endId: number
): Promise<DueReview[]> {
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      const db = await getDrizzleDb();
      
      const data = await db
        .select({
          word_id: quran_words.id,
          word_text: quran_words.text,
          sura_name: quran_suras.name,
          aya_number: quran_words.aya_number,
        })
        .from(quran_words)
        .innerJoin(user_progress, eq(quran_words.id, user_progress.word_id))
        .leftJoin(quran_suras, eq(quran_words.sura_id, quran_suras.id))
        .where(
          and(
            between(quran_words.id, startId, endId),
            lte(user_progress.next_review_date, sql`datetime('now')`)
          )
        )
        .orderBy(asc(user_progress.next_review_date)) // Oldest due first
        .limit(10); // Limit to prevent excessive scanning

      return data as DueReview[];
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error('Error finding due reviews (final attempt):', error);
        return []; // Return empty array instead of throwing
      }
      console.warn(`Error finding due reviews, retrying (${retries}/${maxRetries}):`, error);
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 100 * retries));
    }
  }
  
  return [];
}

/**
 * Finds the nearest can_stop boundary for navigation
 */
export async function findNearestCanStop(
  currentWordId: number,
  direction: 'before' | 'after' = 'before',
  rangeStart?: number,
  rangeEnd?: number
): Promise<number | null> {
  const db = await getDrizzleDb();
  
  try {
    const conditions = [eq(quran_words.can_stop, true)];
    
    if (direction === 'before') {
      conditions.push(lte(quran_words.id, currentWordId));
      if (rangeStart) conditions.push(gte(quran_words.id, rangeStart));
    } else {
      conditions.push(gte(quran_words.id, currentWordId));
      if (rangeEnd) conditions.push(lte(quran_words.id, rangeEnd));
    }

    const data = await db
      .select({ id: quran_words.id })
      .from(quran_words)
      .where(and(...conditions))
      .orderBy(direction === 'before' ? desc(quran_words.id) : asc(quran_words.id))
      .limit(1);

    return data[0]?.id || null;
  } catch (error) {
    console.error('Error finding nearest can_stop:', error);
    return null;
  }
}

/**
 * Gets the starting point for a range considering can_stop boundaries
 */
export async function getRangeStartingPoint(
  startId: number,
  endId: number
): Promise<number> {
  try {
    // Find the nearest can_stop before startId (with 3-word buffer)
    const bufferStart = Math.max(1, startId - 3);
    const nearestCanStop = await findNearestCanStop(bufferStart, 'before', bufferStart, endId);
    
    // If no can_stop found or it's too far back, use the original start
    if (!nearestCanStop || nearestCanStop < bufferStart - 10) {
      return startId;
    }
    
    // Start from the word after the can_stop boundary
    return nearestCanStop + 1;
  } catch (error) {
    console.error('Error getting range starting point:', error);
    return startId; // Fallback to original start
  }
}

/**
 * Checks if there are more words due for review after current position
 */
export async function hasMoreDueReviews(
  currentWordId: number,
  endId: number
): Promise<boolean> {
  const db = await getDrizzleDb();
  
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(quran_words)
      .innerJoin(user_progress, eq(quran_words.id, user_progress.word_id))
      .where(
        and(
          gt(quran_words.id, currentWordId),
          lte(quran_words.id, endId),
          lte(user_progress.next_review_date, sql`datetime('now')`)
        )
      )
      .limit(1);

    return (result[0]?.count || 0) > 0;
  } catch (error) {
    console.error('Error checking for more due reviews:', error);
    return false;
  }
}