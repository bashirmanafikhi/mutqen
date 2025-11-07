// // src/services/data/QuranQueries.ts

// import { AyaTafseer, QuranDivision, QuranJuz, QuranPage, QuranWord, Surah, UserLearning } from "../../models/QuranModels";
// import { getDb } from "../DatabaseConnection"; // Assuming this path is correct

// // =============================
// // Surah Queries
// // =============================

// export async function fetchAllSurahs(): Promise<Surah[]> {
//   const database = await getDb();
//   const query = `
//     SELECT id, name, name_without_tashkeel, page_id, first_word_id, last_word_id, aya_count, revelation_place 
//     FROM quran_suras 
//     ORDER BY id ASC;
//   `;
//   try {
//     return await database.getAllAsync<Surah>(query);
//   } catch (error) {
//     console.error("❌ Error fetching surahs:", error);
//     throw error;
//   }
// }

// export async function fetchWordsBySurahId(suraId: number): Promise<QuranWord[]> {
//   const database = await getDb();
//   const query = `
//     SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya
//     FROM quran_words 
//     WHERE sura_id = ?
//     ORDER BY id ASC;
//   `;
//   try {
//     return await database.getAllAsync<QuranWord>(query, [suraId]); 
//   } catch (error) {
//     console.error(`❌ Error fetching words for surah ${suraId}:`, error);
//     throw error;
//   }
// }

// /**
//  * Fetches words between two IDs, and their parent sura name.
//  */
// export async function fetchWordsByRange(startId: number, endId: number): Promise<QuranWord[]> {
//     const database = await getDb();
//     // This query is simplified for initial setup; you might need to JOIN sura details later.
//     const query = `
//         SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya, can_stop
//         FROM quran_words 
//         WHERE id BETWEEN ? AND ?
//         ORDER BY id ASC;
//     `;
//     try {
//         return await database.getAllAsync<QuranWord>(query, [startId, endId]);
//     } catch (error) {
//         console.error("❌ Error fetching words by range:", error);
//         throw error;
//     }
// }

// // Get first & last word id for a Surah
// export async function fetchWordRangeForSurah(surahId: number) {
//   const db = await getDb();
//   const query = `
//     SELECT MIN(id) as start, MAX(id) as end
//     FROM quran_words
//     WHERE sura_id = ?;
//   `;
//   const result = await db.getFirstAsync<{ start: number, end: number }>(query, [surahId]);
//   return result;
// }

// // Get first & last word id for a Page
// export async function fetchWordRangeForPage(pageId: number) {
//   const db = await getDb();
//   const query = `
//     SELECT MIN(id) as start, MAX(id) as end
//     FROM quran_words
//     WHERE page_id = ?;
//   `;
//   const result = await db.getFirstAsync<{ start: number, end: number }>(query, [pageId]);
//   return result;
// }

// // =============================
// // Page Queries
// // =============================

// export async function fetchAllPages(): Promise<QuranPage[]> {
//     const database = await getDb();
//     const query = `
//         SELECT DISTINCT page_id AS id 
//         FROM quran_words 
//         ORDER BY page_id ASC;
//     `; 
//     try {
//         return await database.getAllAsync<QuranPage>(query);
//     } catch (error) {
//         console.error("❌ Error fetching pages:", error);
//         throw error;
//     }
// }

// // =============================
// // Learning Queries
// // =============================

// export async function fetchAllLearnings(): Promise<UserLearning[]> {
//     const database = await getDb();
//     const query = `
//         SELECT id, title, first_word_id, last_word_id, created_at
//         FROM user_learnings 
//         ORDER BY created_at DESC;
//     `;
//     try {
//         return await database.getAllAsync<UserLearning>(query);
//     } catch (error) {
//         console.error("❌ Error fetching user learnings:", error);
//         throw error;
//     }
// }

// /**
//  * Inserts a new learning item and returns the newly created item (with ID and timestamp).
//  */
// export async function insertNewLearning(title: string, startWordId: number, endWordId: number): Promise<UserLearning> {
//     const database = await getDb();
//     const query = `
//         INSERT INTO user_learnings (title, first_word_id, last_word_id)
//         VALUES (?, ?, ?);
//     `;
//     try {
//         const result = await database.runAsync(query, [title, startWordId, endWordId]);

//         if (result.lastInsertRowId === undefined) {
//             throw new Error("Failed to retrieve new learning ID.");
//         }

//         // Fetch the newly inserted row to get created_at and the actual ID
//         const newLearning = await database.getFirstAsync<UserLearning>(
//             `SELECT id, title, first_word_id, last_word_id, created_at FROM user_learnings WHERE id = ?`,
//             [result.lastInsertRowId]
//         );

//         if (!newLearning) throw new Error("Could not fetch inserted row.");
        
//         return newLearning;

//     } catch (error) {
//         console.error("❌ Error inserting new learning:", error);
//         throw error;
//     }
// }

// /**
//  * Deletes a learning item from the 'user_learnings' table by ID.
//  */
// export async function deleteLearningById(id: number): Promise<void> {
//     const database = await getDb();
//     const query = `
//         DELETE FROM user_learnings 
//         WHERE id = ?;
//     `;
//     try {
//         await database.runAsync(query, [id]);
//     } catch (error) {
//         console.error(`❌ Error deleting learning item ID ${id}:`, error);
//         throw error;
//     }
// }

// // =============================
// // Juz Queries
// // =============================

// export async function fetchAllJuzs(): Promise<QuranJuz[]> {
//     const database = await getDb();
//     const query = `
//         SELECT id, name, first_word_id, last_word_id 
//         FROM quran_juzs 
//         ORDER BY id ASC;
//     `; 
//     try {
//         return await database.getAllAsync<QuranJuz>(query);
//     } catch (error) {
//         console.error("❌ Error fetching Juzs:", error);
//         throw error;
//     }
// }

// /**
//  * Fetch tafseer text for a specific sura and aya.
//  */
// export async function fetchTafseerByAya(
//   suraId: number,
//   ayaNumber: number
// ): Promise<AyaTafseer | null> {
//   const database = await getDb();
//   const query = `
//     SELECT sura_id, aya_number, text
//     FROM aya_tafseers
//     WHERE sura_id = ? AND aya_number = ?
//     LIMIT 1;
//   `;

//   try {
//     const result = await database.getFirstAsync<AyaTafseer>(query, [suraId, ayaNumber]);
//     return result || null;
//   } catch (error) {
//     console.error("❌ Error fetching tafseer by aya:", error);
//     throw error;
//   }
// }

// /**
//  * Fetch tafseers for a range of ayas (useful for lists).
//  */
// export async function fetchTafseersByRange(
//   suraId: number,
//   startAya: number,
//   endAya: number
// ): Promise<AyaTafseer[]> {
//   const database = await getDb();
//   const query = `
//     SELECT sura_id, aya_number, text
//     FROM aya_tafseers
//     WHERE sura_id = ? AND aya_number BETWEEN ? AND ?
//     ORDER BY aya_number ASC;
//   `;

//   try {
//     return await database.getAllAsync<AyaTafseer>(query, [suraId, startAya, endAya]);
//   } catch (error) {
//     console.error("❌ Error fetching tafseers by range:", error);
//     throw error;
//   }
// }

// // =============================
// // Hizb Queries
// // =============================
// export async function fetchAllHizbs(): Promise<QuranDivision[]> {
//   const database = await getDb();
//   const query = `
//       SELECT id, type, name, first_word_id, last_word_id
//       FROM quran_divisions
//       WHERE type IN ('hizb', 'quarter-hizb')
//       ORDER BY id ASC;
//   `;
//   try {
//     return await database.getAllAsync<QuranDivision>(query);
//   } catch (error) {
//     console.error("❌ Error fetching hizbs:", error);
//     throw error;
//   }
// }

// // =============================
// // Sahaba Divisions Queries
// // =============================
// export async function fetchAllSahabaDivisions(): Promise<QuranDivision[]> {
//   const database = await getDb();
//   const query = `
//     SELECT id, type, name, first_word_id, last_word_id
//     FROM quran_divisions
//     WHERE type = 'juz'
//     ORDER BY id ASC;
//   `;
//   try {
//     return await database.getAllAsync<QuranDivision>(query);
//   } catch (error) {
//     console.error("❌ Error fetching Sahaba divisions:", error);
//     throw error;
//   }
// }