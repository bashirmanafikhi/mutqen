// src/services/SpacedRepetitionService.ts

import { UserProgress } from '@/models/QuranModels';
import { getDb } from './DatabaseConnection'; // adjust path if needed

/**
 * Configurable thresholds & baseline durations (in seconds)
 */
const BASE = {
  NEW_FIRST_INTERVAL: 30,        // 30 seconds first retry
  SECOND_INTERVAL: 60,           // 1 minute
  THIRD_INTERVAL: 300,           // 5 minutes
  FOURTH_INTERVAL: 3600,         // 1 hour
  FIFTH_INTERVAL: 86400,         // 1 day
  MIN_EASE_FACTOR: 1.3,
  DEFAULT_EASE_FACTOR: 2.5,
};

/**
 * Calculate new ease factor using SM-2 like formula.
 * Always applied for every response (quality 1..5).
 */
function calculateNewEaseFactor(easeFactor: number, quality: number): number {
  // SM-2 formula variant:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = Math.max(1, Math.min(5, quality));
  const newEf = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(BASE.MIN_EASE_FACTOR, Math.round(newEf * 100) / 100); // round to 2 decimals
}

/**
 * Compute a seconds-based interval based on repetition count and ease factor.
 * Early reps use short fixed seconds; later reps use easeFactor multiplicative growth.
 *
 * repetition: number of consecutive successful reviews (after last failure)
 * easeFactor: EF value
 * quality: 1..5 (used only to drive repetition reset)
 */
function calculateNewIntervalSeconds(repetition: number, easeFactor: number, quality: number, previousIntervalSeconds: number): number {
  // If failed (<3) we reset externally; this function handles success path.
  if (repetition <= 0) {
    return BASE.NEW_FIRST_INTERVAL;
  }
  if (repetition === 1) {
    return BASE.SECOND_INTERVAL;
  }
  if (repetition === 2) {
    return BASE.THIRD_INTERVAL;
  }
  if (repetition === 3) {
    return BASE.FOURTH_INTERVAL;
  }
  if (repetition === 4) {
    return BASE.FIFTH_INTERVAL;
  }
  // For repetition >=5 use multiplicative growth with EF but convert to seconds-based growth:
  // previousIntervalSeconds * easeFactor (rounded)
  const next = Math.ceil(previousIntervalSeconds * easeFactor);
  // Cap growth to a minimum of 1 day after maturity so intervals become in days naturally
  // but keep value in seconds. No hard upper cap here.
  return next;
}

/**
 * Compute memory tier for UI based on simple rules. Adjust thresholds as needed.
 * Returns integer tier:
 * 0 = not learned, 1 = weak, 2 = fair, 3 = good, 4 = strong/mastered
 */
export function getMemoryTier(progress: Partial<UserProgress> | null): number {
  if (!progress) return 0;
  const rep = progress.review_count ?? 0;
  const ef = progress.ease_factor ?? BASE.DEFAULT_EASE_FACTOR;
  const interval = progress.current_interval ?? 0; // seconds

  if (rep === 0) return 0; // not learned

  // Lapses override: if too many lapses -> weak
  if ((progress as any).lapses >= 2) return 1;

  // Fast graduation: if repetition high and EF high and interval >= 6 days (in seconds)
  const sixDays = 6 * 24 * 3600;
  if (rep >= 10 && ef >= 2.4 && interval >= sixDays) return 4;
  if (rep >= 5 && ef >= 2.2 && interval >= 24 * 3600) return 3;
  if (rep >= 3) return 2;
  return 1; // weak but in progress
}

/**
 * Build an updated UserProgress object (not persisted) based on currentProgress and user quality (1..5).
 * - Supports seconds-based early repetitions.
 * - Degrades EF on poor performance.
 * - Resets repetition on failure (quality < 3).
 */
export function getUpdatedProgress(currentProgress: UserProgress | null, quality: number): UserProgress {
  const now = new Date().toISOString();
  // Normalize quality
  const q = Math.max(1, Math.min(5, Math.round(quality)));

  // Initialize defaults
  let progress: UserProgress = currentProgress || {
    word_id: 0,
    current_interval: 0, // seconds
    review_count: 0,
    ease_factor: BASE.DEFAULT_EASE_FACTOR,
    next_review_date: new Date().toISOString(),
    last_review_date: new Date().toISOString(),
    last_successful_date: null,
    memory_tier: 0,
    lapses: 0,
    notes: null
  };

  // always update EF (decrease on failures)
  progress.ease_factor = calculateNewEaseFactor(progress.ease_factor ?? BASE.DEFAULT_EASE_FACTOR, q);

  // decide repetition logic:
  // We'll base "repetition streak" on review_count concept:
  // If quality >= 3 => success: increment review_count; else reset review_count (but keep total attempts via lapses)
  if (q >= 3) {
    // success path
    const newRepetition = (progress.review_count ?? 0) + 1;
    // previous interval in seconds
    const prevInterval = Math.max(1, Math.ceil(progress.current_interval ?? 0) || BASE.NEW_FIRST_INTERVAL);
    const nextIntervalSeconds = calculateNewIntervalSeconds(newRepetition, progress.ease_factor, q, prevInterval);

    progress.current_interval = nextIntervalSeconds;
    progress.review_count = newRepetition;
    progress.last_successful_date = now;
  } else {
    // failure path: reset repetition and set quick retry interval (seconds)
    progress.lapses = (progress.lapses ?? 0) + 1;
    progress.review_count = 0;
    progress.current_interval = BASE.NEW_FIRST_INTERVAL; // immediate short retry
  }

  // compute next review date from interval in seconds
  const nextDate = new Date();
  nextDate.setSeconds(nextDate.getSeconds() + Math.ceil(progress.current_interval));
  progress.next_review_date = nextDate.toISOString();

  progress.last_review_date = now;

  // compute tier for UI and store
  progress.memory_tier = getMemoryTier(progress);

  // ensure EF lower bound
  progress.ease_factor = Math.max(BASE.MIN_EASE_FACTOR, progress.ease_factor);

  return progress;
}

/**
 * DB helpers: fetch and upsert. These mirror style of your existing QuranQueries.ts.
 * Assumes getDb() returns a database object with getFirstAsync / getAllAsync / runAsync
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

  // Check existing
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
      (word_id, current_interval, review_count, lapses, ease_factor, next_review_date, last_review_date, last_successful_date, created_at, memory_tier, notes)
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
}

/**
 * Fetch all progress rows for a given word id range (inclusive).
 * Useful for building the multi-color progress bar component.
 */
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

/**
 * Compute counts & percentages per memory_tier for a given word id range.
 * Also includes counts of words with NO progress row (not learned).
 * Returns an object suitable for rendering segmented progress bar.
 */
export async function computeRangeTierStats(startId: number, endId: number) {
  const db = await getDb();

  // 1) total words in range
  const totalWordsRes = await db.getFirstAsync<{ total: number }>(`
    SELECT COUNT(*) as total FROM quran_words WHERE id BETWEEN ? AND ?;
  `, [startId, endId]);
  const total = totalWordsRes?.total ?? 0;
  if (total === 0) {
    return { total: 0, tiers: {}, raw: [] };
  }

  // 2) counts by tier (from user_progress)
  const tierQuery = `
    SELECT memory_tier, COUNT(*) AS cnt
    FROM user_progress
    WHERE word_id BETWEEN ? AND ?
    GROUP BY memory_tier;
  `;
  const tierRows: Array<{ memory_tier: number, cnt: number }> = await db.getAllAsync(tierQuery, [startId, endId]);

  // Map existing progress counts
  const tierMap: Record<number, number> = {};
  tierRows.forEach(r => { tierMap[r.memory_tier] = r.cnt; });

  // 3) count rows with progress present
  const learnedRes = await db.getFirstAsync<{ learned: number }>(`
    SELECT COUNT(*) AS learned FROM user_progress WHERE word_id BETWEEN ? AND ?;
  `, [startId, endId]);
  const learned = learnedRes?.learned ?? 0;
  const notLearned = total - learned;

  // Prepare standardized buckets (0..4)
  const buckets: Record<number, number> = {
    0: notLearned, // not learned
    1: tierMap[1] ?? 0, // weak
    2: tierMap[2] ?? 0, // fair
    3: tierMap[3] ?? 0, // good
    4: tierMap[4] ?? 0, // mastered
  };

  // Convert to percentages
  const tiersPercent: Record<string, { count: number; percent: number }> = {};
  Object.keys(buckets).forEach(k => {
    const count = buckets[parseInt(k)];
    tiersPercent[k] = { count, percent: Math.round((count / total) * 10000) / 100 }; // two decimals
  });

  return { total, tiers: tiersPercent, rawBuckets: buckets };
}
