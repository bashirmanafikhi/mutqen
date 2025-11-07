// src/services/SpacedRepetitionService.ts

import { UserProgress } from '@/models/QuranModels';
import { getDb } from './DatabaseConnection'; // adjust path if needed

/**
 * ==============================
 * 📦 BASE CONFIGURATION CONSTANTS
 * ==============================
 * Defines the spaced repetition baseline and bounds.
 * All intervals are in seconds.
 */
const BASE = {
  NEW_FIRST_INTERVAL: 30,               // 30 seconds first retry
  MIN_EASE_FACTOR: 1.3,
  DEFAULT_EASE_FACTOR: 2.5,
  MAX_EASE_FACTOR: 3.5,
  MAX_INTERVAL_SECONDS: 60 * 60 * 24 * 7, // 7 days max interval
};

/**
 * ======================================
 * 🧮 Ease Factor Calculation (SM-2 logic)
 * ======================================
 * Adjusts EF after every review.
 * - Decreases on poor answers (q < 3)
 * - Slightly increases on perfect answers
 */
function calculateNewEaseFactor(easeFactor: number, quality: number): number {
  const q = Math.max(1, Math.min(5, quality));
  const newEf = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Clamp EF between min and max to avoid extreme growth
  return Math.min(BASE.MAX_EASE_FACTOR, Math.max(BASE.MIN_EASE_FACTOR, Math.round(newEf * 100) / 100));
}

/**
 * ==============================================
 * ⏱️ Interval Calculation (seconds-based growth)
 * ==============================================
 * Produces a smooth progression curve:
 *   - Starts with seconds/minutes intervals
 *   - Gradually increases toward hours and days
 *   - Prevents any exponential explosion
 */
export function calculateNewIntervalSeconds(
  repetition: number,
  easeFactor: number,
  quality: number,
  prevInterval: number
): number {
  const base = BASE.NEW_FIRST_INTERVAL; // 30 seconds

  // Controlled exponential growth: 25% of EF only
  const growthRate = 1 + (easeFactor - 1) * 0.25;
  let next = base * Math.pow(growthRate, repetition - 1);

  // Additional acceleration after 4th repetition (gentle quadratic curve)
  if (repetition > 4) {
    next += Math.pow(repetition - 3, 2) * 60; // adds +1min² after 4th rep
  }

  // ±5% based on performance
  next *= 1 + (quality - 3) * 0.05;

  // Avoid big jumps: max 3× previous interval
  if (prevInterval > 0) {
    next = Math.min(next, prevInterval * 3);
  }

  // Cap to maximum (7 days)
  return Math.min(next, BASE.MAX_INTERVAL_SECONDS);
}

/**
 * =============================
 * 🧠 Memory Tier Classification
 * =============================
 * Determines user mastery stage for UI display.
 * 0 = not learned
 * 1 = weak
 * 2 = fair
 * 3 = good
 * 4 = mastered
 */
export function getMemoryTier(progress: Partial<UserProgress> | null): number {
  if (!progress) return 0;
  const rep = progress.review_count ?? 0;
  const ef = progress.ease_factor ?? BASE.DEFAULT_EASE_FACTOR;
  const interval = progress.current_interval ?? 0;
  const lapses = progress.lapses ?? 0;

  if (rep === 0) return 0; // not learned
  if (lapses >= 2) return 1; // weak if too many lapses

  const threeDays = 3 * 24 * 3600;
  const oneDay = 24 * 3600;

  if (rep >= 8 && ef >= 2.3 && interval >= threeDays) return 4; // mastered
  if (rep >= 5 && ef >= 2.1 && interval >= oneDay) return 3;    // good
  if (rep >= 3) return 2;                                       // fair
  return 1;                                                     // weak
}

/**
 * ===============================================
 * 🔁 Update UserProgress after each review session
 * ===============================================
 * Handles EF, interval, repetition, lapse tracking,
 * and next review scheduling.
 */
export function getUpdatedProgress(currentProgress: UserProgress | null, quality: number): UserProgress {
  const now = new Date().toISOString();
  const q = Math.max(1, Math.min(5, Math.round(quality)));

  let progress: UserProgress = currentProgress || {
    word_id: 0,
    current_interval: 0,
    review_count: 0,
    ease_factor: BASE.DEFAULT_EASE_FACTOR,
    next_review_date: now,
    last_review_date: now,
    last_successful_date: null,
    memory_tier: 0,
    lapses: 0,
    notes: null
  };

  // Update Ease Factor
  progress.ease_factor = calculateNewEaseFactor(progress.ease_factor ?? BASE.DEFAULT_EASE_FACTOR, q);

  if (q >= 3) {
    // ✅ Success Path
    const newRepetition = (progress.review_count ?? 0) + 1;
    const prevInterval = Math.max(1, Math.ceil(progress.current_interval ?? 0) || BASE.NEW_FIRST_INTERVAL);
    const nextIntervalSeconds = calculateNewIntervalSeconds(newRepetition, progress.ease_factor, q, prevInterval);

    progress.current_interval = nextIntervalSeconds;
    progress.review_count = newRepetition;
    progress.last_successful_date = now;

  } else {
    // ❌ Failure Path
    progress.lapses = (progress.lapses ?? 0) + 1;
    progress.review_count = 0;
    progress.current_interval = BASE.NEW_FIRST_INTERVAL; // retry after 30s
  }

  // Compute next review date
  const nextDate = new Date();
  nextDate.setSeconds(nextDate.getSeconds() + Math.ceil(progress.current_interval));
  progress.next_review_date = nextDate.toISOString();
  progress.last_review_date = now;

  // Determine memory tier
  progress.memory_tier = getMemoryTier(progress);

  // Enforce lower bound for EF
  progress.ease_factor = Math.max(BASE.MIN_EASE_FACTOR, progress.ease_factor);

  return progress;
}

/**
 * ======================
 * 💾 DATABASE OPERATIONS
 * ======================
 * fetch / upsert / range / stats
 */

export async function fetchProgressByWordIdDb(wordId: number): Promise<UserProgress | null> {
  const db = await getDb();
  const query = `
    SELECT word_id, current_interval, review_count, lapses, ease_factor,
           next_review_date, last_review_date, last_successful_date, created_at, memory_tier, notes
    FROM user_progress WHERE word_id = ?;
  `;
  try {
    return await db.getFirstAsync<UserProgress>(query, [wordId]);
  } catch (err) {
    console.error('Error fetching progress:', err);
    return null;
  }
}

export async function upsertProgressDb(progress: UserProgress): Promise<void> {
  const db = await getDb();
  try {
    const existing = await fetchProgressByWordIdDb(progress.word_id);

    if (existing) {
      const updateQuery = `
        UPDATE user_progress SET
          current_interval = ?,
          review_count = ?,
          lapses = ?,
          ease_factor = ?,
          next_review_date = ?,
          last_review_date = ?,
          last_successful_date = ?,
          memory_tier = ?,
          notes = ?
        WHERE word_id = ?;
      `;
      await db.runAsync(updateQuery, [
        progress.current_interval,
        progress.review_count,
        progress.lapses ?? 0,
        progress.ease_factor,
        progress.next_review_date,
        progress.last_review_date,
        progress.last_successful_date ?? null,
        progress.memory_tier ?? 0,
        progress.notes ?? null,
        progress.word_id
      ]);
    } else {
      const insertQuery = `
        INSERT INTO user_progress
        (word_id, current_interval, review_count, lapses, ease_factor,
         next_review_date, last_review_date, last_successful_date,
         created_at, memory_tier, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?);
      `;
      await db.runAsync(insertQuery, [
        progress.word_id,
        progress.current_interval,
        progress.review_count,
        progress.lapses ?? 0,
        progress.ease_factor,
        progress.next_review_date,
        progress.last_review_date,
        progress.last_successful_date ?? null,
        progress.memory_tier ?? 0,
        progress.notes ?? null,
      ]);
    }
  } catch (err) {
    console.error('Error upserting progress:', err);
  }
}

export async function fetchProgressRangeDb(startId: number, endId: number): Promise<UserProgress[]> {
  const db = await getDb();
  const query = `
    SELECT word_id, current_interval, review_count, lapses, ease_factor,
           next_review_date, last_review_date, last_successful_date, created_at, memory_tier
    FROM user_progress
    WHERE word_id BETWEEN ? AND ?;
  `;
  try {
    return await db.getAllAsync<UserProgress>(query, [startId, endId]);
  } catch (err) {
    console.error('Error fetching progress range:', err);
    return [];
  }
}

export async function computeRangeTierStats(startId: number, endId: number) {
  const db = await getDb();

  // Total words in range
  const totalWordsRes = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM quran_words WHERE id BETWEEN ? AND ?;`,
    [startId, endId]
  );
  const total = totalWordsRes?.total ?? 0;
  if (total === 0) return { total: 0, tiers: {}, raw: [] };

  // Counts by tier
  const tierQuery = `
    SELECT memory_tier, COUNT(*) AS cnt
    FROM user_progress
    WHERE word_id BETWEEN ? AND ?
    GROUP BY memory_tier;
  `;
  const tierRows: Array<{ memory_tier: number, cnt: number }> = await db.getAllAsync(tierQuery, [startId, endId]);
  const tierMap: Record<number, number> = {};
  tierRows.forEach(r => { tierMap[r.memory_tier] = r.cnt; });

  // Count learned vs not learned
  const learnedRes = await db.getFirstAsync<{ learned: number }>(
    `SELECT COUNT(*) AS learned FROM user_progress WHERE word_id BETWEEN ? AND ?;`,
    [startId, endId]
  );
  const learned = learnedRes?.learned ?? 0;
  const notLearned = total - learned + (tierMap[0] ?? 0);

  // Normalize buckets (0–4)
  const buckets: Record<number, number> = {
    0: notLearned,
    1: tierMap[1] ?? 0,
    2: tierMap[2] ?? 0,
    3: tierMap[3] ?? 0,
    4: tierMap[4] ?? 0,
  };

  // Convert to percentages
  const tiersPercent: Record<string, { count: number; percent: number }> = {};
  Object.keys(buckets).forEach(k => {
    const count = buckets[parseInt(k)];
    tiersPercent[k] = {
      count,
      percent: Math.round((count / total) * 10000) / 100
    };
  });

  return { total, tiers: tiersPercent, rawBuckets: buckets };
}
