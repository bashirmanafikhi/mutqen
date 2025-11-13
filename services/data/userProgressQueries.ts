import { quran_words, user_progress } from "@/db/schema";
import { UserProgress } from "@/models/QuranModels";
import { between, eq, sql } from 'drizzle-orm';
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * ======================
 * 💾 DATABASE OPERATIONS
 * ======================
 * fetch / upsert / range / stats
 */

/**
 * Fetches a single user progress record by word ID.
 * Corresponds to: SELECT ... FROM user_progress WHERE word_id = ?;
 */
export async function fetchProgressByWordIdDb(wordId: number): Promise<UserProgress | null> {
  const db = await getDrizzleDb();
  
  try {
    const result = await db
      .select({
        word_id: user_progress.word_id,
        current_interval: user_progress.current_interval,
        review_count: user_progress.review_count,
        lapses: user_progress.lapses,
        ease_factor: user_progress.ease_factor,
        next_review_date: user_progress.next_review_date,
        last_review_date: user_progress.last_review_date,
        last_successful_date: user_progress.last_successful_date,
        created_at: user_progress.created_at,
        memory_tier: user_progress.memory_tier,
        notes: user_progress.notes,
      })
      .from(user_progress)
      .where(eq(user_progress.word_id, wordId))
      .limit(1);

    // Drizzle returns an array, return the first element or null if empty
    return (result[0] as UserProgress) || null;
  } catch (err) {
    console.error('Error fetching progress:', err);
    return null;
  }
}

/**
 * Inserts or Updates (Upsert) a user progress record.
 * This implementation uses Drizzle's `insert` with `onConflictDoUpdate` 
 * which is the idiomatic way to handle upserts in Drizzle ORM.
 */
export async function upsertProgressDb(progress: UserProgress): Promise<void> {
  const db = await getDrizzleDb();
  
  // Prepare values for insertion/update
  const values = {
    word_id: progress.word_id,
    current_interval: progress.current_interval,
    review_count: progress.review_count,
    lapses: progress.lapses ?? 0,
    ease_factor: progress.ease_factor,
    next_review_date: progress.next_review_date,
    last_review_date: progress.last_review_date,
    last_successful_date: progress.last_successful_date ?? null,
    memory_tier: progress.memory_tier ?? 0,
    notes: progress.notes ?? null,
    // created_at is only set on INSERT, not UPDATE.
  };

  try {
    // Attempt INSERT with ON CONFLICT DO UPDATE
    await db.insert(user_progress)
      .values({
        ...values,
        // Only set created_at on initial insertion
        created_at: progress.created_at || sql`datetime('now')`, 
      })
      .onConflictDoUpdate({
        // Define the conflict target (primary/unique key)
        target: user_progress.word_id, 
        // Define columns to update on conflict (all except word_id and created_at)
        set: {
          current_interval: values.current_interval,
          review_count: values.review_count,
          lapses: values.lapses,
          ease_factor: values.ease_factor,
          next_review_date: values.next_review_date,
          last_review_date: values.last_review_date,
          last_successful_date: values.last_successful_date,
          memory_tier: values.memory_tier,
          notes: values.notes,
        },
      });
      
  } catch (err) {
    console.error('Error upserting progress:', err);
  }
}

/**
 * Fetches user progress records for a range of word IDs.
 * Corresponds to: SELECT ... FROM user_progress WHERE word_id BETWEEN ? AND ?;
 */
export async function fetchProgressRangeDb(startId: number, endId: number): Promise<UserProgress[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .select({
        word_id: user_progress.word_id,
        current_interval: user_progress.current_interval,
        review_count: user_progress.review_count,
        lapses: user_progress.lapses,
        ease_factor: user_progress.ease_factor,
        next_review_date: user_progress.next_review_date,
        last_review_date: user_progress.last_review_date,
        last_successful_date: user_progress.last_successful_date,
        created_at: user_progress.created_at,
        memory_tier: user_progress.memory_tier,
        notes: user_progress.notes,
      })
      .from(user_progress)
      .where(between(user_progress.word_id, startId, endId)); // WHERE word_id BETWEEN ? AND ?

    return data as UserProgress[];
  } catch (err) {
    console.error('Error fetching progress range:', err);
    return [];
  }
}

/**
 * Computes statistics for memory tiers within a word ID range.
 */
export async function computeRangeTierStats(startId: number | null, endId: number | null) {
  if (startId === null || endId === null) return { total: 0, tiers: {}, rawBuckets: {} };

  const db = await getDrizzleDb();

  try {
    // 1. Total words in range (from quran_words)
    const totalWordsRes = await db
      .select({ total: sql<number>`count(*)` })
      .from(quran_words)
      .where(between(quran_words.id, startId, endId));
      
    const total = totalWordsRes[0]?.total ?? 0;
    if (total === 0) return { total: 0, tiers: {}, rawBuckets: {} };

    // 2. Counts by tier (from user_progress, using GROUP BY)
    const tierRows = await db
      .select({
        memory_tier: user_progress.memory_tier,
        cnt: sql<number>`count(*)`
      })
      .from(user_progress)
      .where(between(user_progress.word_id, startId, endId))
      .groupBy(user_progress.memory_tier);
      
    const tierMap: Record<number, number> = {};
    tierRows.forEach(r => { 
      // Drizzle may return memory_tier as number or string depending on column definition, 
      // ensuring it's treated as a number key here.
      const tierKey = typeof r.memory_tier === 'string' ? parseInt(r.memory_tier) : r.memory_tier;
      tierMap[tierKey] = r.cnt; 
    });

    // 3. Calculate 'Not Learned' (Tier 0)
    // The total number of words in the range, minus those present in user_progress 
    // (where memory_tier > 0). The original logic is slightly complex, let's simplify:
    
    // Count of words that HAVE progress (memory_tier >= 1 or memory_tier = 0 in progress table)
    const wordsWithProgressRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(user_progress)
        .where(between(user_progress.word_id, startId, endId));
        
    const wordsWithProgress = wordsWithProgressRes[0]?.count ?? 0;

    // The 'Not Learned' group (Tier 0) is the total words minus words *with* any progress entry.
    // The logic below mimics the original SQL/JS combination:
    // notLearned = total - learned + (tierMap[0] ?? 0)
    // where 'learned' in the original code seems to be total rows in user_progress for the range.
    
    const learned = wordsWithProgress; // Total rows in user_progress
    const notLearned = total - learned; // Words in range without an entry in user_progress

    // Normalize buckets (0–4)
    const buckets: Record<number, number> = {
      0: notLearned, // Words not present in user_progress
      1: tierMap[1] ?? 0,
      2: tierMap[2] ?? 0,
      3: tierMap[3] ?? 0,
      4: tierMap[4] ?? 0,
    };
    
    // If the original logic intended to include rows with memory_tier=0 from user_progress 
    // into the 'Not Learned' category:
    buckets[0] += tierMap[0] ?? 0;


    // Convert to percentages
    const tiersPercent: Record<string, { count: number; percent: number }> = {};
    Object.keys(buckets).forEach(k => {
      const count = buckets[parseInt(k)];
      tiersPercent[k] = {
        count,
        percent: total === 0 ? 0 : Math.round((count / total) * 10000) / 100
      };
    });

    return { total, tiers: tiersPercent, rawBuckets: buckets };
  } catch (err) {
    console.error('Error computing range tier stats:', err);
    return { total: 0, tiers: {}, rawBuckets: {} };
  }
}