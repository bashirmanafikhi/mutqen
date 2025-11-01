// src/services/data/QuranQueries.ts

import { QuranJuz, QuranPage, QuranWord, Surah, UserLearning, UserProgress } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection"; // Assuming this path is correct

// =============================
// Surah Queries
// =============================

export async function fetchAllSurahs(): Promise<Surah[]> {
  const database = await getDb();
  const query = `
    SELECT id, name, aya_count, revelation_place 
    FROM quran_suras 
    ORDER BY id ASC;
  `;
  try {
    return await database.getAllAsync<Surah>(query);
  } catch (error) {
    console.error("❌ Error fetching surahs:", error);
    throw error;
  }
}

export async function fetchWordsBySurahId(suraId: number): Promise<QuranWord[]> {
  const database = await getDb();
  const query = `
    SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya
    FROM quran_words 
    WHERE sura_id = ?
    ORDER BY id ASC;
  `;
  try {
    return await database.getAllAsync<QuranWord>(query, [suraId]); 
  } catch (error) {
    console.error(`❌ Error fetching words for surah ${suraId}:`, error);
    throw error;
  }
}

/**
 * Fetches words between two IDs, and their parent sura name.
 */
export async function fetchWordsByRange(startId: number, endId: number): Promise<QuranWord[]> {
    const database = await getDb();
    // This query is simplified for initial setup; you might need to JOIN sura details later.
    const query = `
        SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya, can_stop
        FROM quran_words 
        WHERE id BETWEEN ? AND ?
        ORDER BY id ASC;
    `;
    try {
        return await database.getAllAsync<QuranWord>(query, [startId, endId]);
    } catch (error) {
        console.error("❌ Error fetching words by range:", error);
        throw error;
    }
}

// Get first & last word id for a Surah
export async function fetchWordRangeForSurah(surahId: number) {
  const db = await getDb();
  const query = `
    SELECT MIN(id) as start, MAX(id) as end
    FROM quran_words
    WHERE sura_id = ?;
  `;
  const result = await db.getFirstAsync<{ start: number, end: number }>(query, [surahId]);
  return result;
}

// Get first & last word id for a Page
export async function fetchWordRangeForPage(pageId: number) {
  const db = await getDb();
  const query = `
    SELECT MIN(id) as start, MAX(id) as end
    FROM quran_words
    WHERE page_id = ?;
  `;
  const result = await db.getFirstAsync<{ start: number, end: number }>(query, [pageId]);
  return result;
}

// =============================
// Page Queries
// =============================

export async function fetchAllPages(): Promise<QuranPage[]> {
    const database = await getDb();
    const query = `
        SELECT DISTINCT page_id AS id 
        FROM quran_words 
        ORDER BY page_id ASC;
    `; 
    try {
        return await database.getAllAsync<QuranPage>(query);
    } catch (error) {
        console.error("❌ Error fetching pages:", error);
        throw error;
    }
}

// =============================
// Learning Queries
// =============================

export async function fetchAllLearnings(): Promise<UserLearning[]> {
    const database = await getDb();
    const query = `
        SELECT id, title, start_word_id, end_word_id, created_at
        FROM user_learnings 
        ORDER BY created_at DESC;
    `;
    try {
        return await database.getAllAsync<UserLearning>(query);
    } catch (error) {
        console.error("❌ Error fetching user learnings:", error);
        throw error;
    }
}

/**
 * Inserts a new learning item and returns the newly created item (with ID and timestamp).
 */
export async function insertNewLearning(title: string, startWordId: number, endWordId: number): Promise<UserLearning> {
    const database = await getDb();
    const query = `
        INSERT INTO user_learnings (title, start_word_id, end_word_id)
        VALUES (?, ?, ?);
    `;
    try {
        const result = await database.runAsync(query, [title, startWordId, endWordId]);

        if (result.lastInsertRowId === undefined) {
            throw new Error("Failed to retrieve new learning ID.");
        }

        // Fetch the newly inserted row to get created_at and the actual ID
        const newLearning = await database.getFirstAsync<UserLearning>(
            `SELECT id, title, start_word_id, end_word_id, created_at FROM user_learnings WHERE id = ?`,
            [result.lastInsertRowId]
        );

        if (!newLearning) throw new Error("Could not fetch inserted row.");
        
        return newLearning;

    } catch (error) {
        console.error("❌ Error inserting new learning:", error);
        throw error;
    }
}

/**
 * Deletes a learning item from the 'user_learnings' table by ID.
 */
export async function deleteLearningById(id: number): Promise<void> {
    const database = await getDb();
    const query = `
        DELETE FROM user_learnings 
        WHERE id = ?;
    `;
    try {
        await database.runAsync(query, [id]);
    } catch (error) {
        console.error(`❌ Error deleting learning item ID ${id}:`, error);
        throw error;
    }
}

// =============================
// Juz Queries
// =============================

export async function fetchAllJuzs(): Promise<QuranJuz[]> {
    const database = await getDb();
    const query = `
        SELECT id, name, first_word_id, last_word_id 
        FROM quran_juzs 
        ORDER BY id ASC;
    `; 
    try {
        return await database.getAllAsync<QuranJuz>(query);
    } catch (error) {
        console.error("❌ Error fetching Juzs:", error);
        throw error;
    }
}

// =============================
// Progress Queries (NEW)
// =============================

/**
 * Fetches progress data for a specific word.
 */
export async function fetchProgressByWordId(wordId: number): Promise<UserProgress | null> {
    const database = await getDb();
    const query = `
        SELECT word_id, current_interval, review_count, ease_factor, next_review_date, last_review_date 
        FROM user_progress 
        WHERE word_id = ?;
    `;
    try {
        return await database.getFirstAsync<UserProgress>(query, [wordId]);
    } catch (error) {
        console.error(`❌ Error fetching progress for word ${wordId}:`, error);
        return null; // Return null on error
    }
}

/**
 * Inserts or updates the progress of a word.
 */
export async function upsertProgress(progress: UserProgress): Promise<void> {
    const database = await getDb();
    
    // Check if the record exists
    const existing = await fetchProgressByWordId(progress.word_id);

    if (existing) {
        // UPDATE
        const updateQuery = `
            UPDATE user_progress SET 
                current_interval = ?, 
                review_count = ?, 
                ease_factor = ?, 
                next_review_date = ?, 
                last_review_date = ?
            WHERE word_id = ?;
        `;
        await database.runAsync(updateQuery, [
            progress.current_interval,
            progress.review_count,
            progress.ease_factor,
            progress.next_review_date,
            progress.last_review_date,
            progress.word_id,
        ]);
        
    } else {
        // INSERT
        const insertQuery = `
            INSERT INTO user_progress 
            (word_id, current_interval, review_count, ease_factor, next_review_date, last_review_date)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        await database.runAsync(insertQuery, [
            progress.word_id,
            progress.current_interval,
            progress.review_count,
            progress.ease_factor,
            progress.next_review_date,
            progress.last_review_date,
        ]);
    }
}