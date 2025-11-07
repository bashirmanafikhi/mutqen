
/**
 * ======================
 * 💾 DATABASE OPERATIONS
 * ======================
 * fetch / upsert / range / stats
 */

import { UserProgress } from "@/models/QuranModels";
import { getDb } from "../DatabaseConnection";

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
