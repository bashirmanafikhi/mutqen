import { QuranWord } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchWordsBySurahId(suraId: number): Promise<QuranWord[]> {
  const db = await getDb();
  const query = `
    SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya
    FROM quran_words 
    WHERE sura_id = ?
    ORDER BY id ASC;
  `;
  try {
    return await db.getAllAsync<QuranWord>(query, [suraId]);
  } catch (error) {
    console.error(`❌ Error fetching words for surah ${suraId}:`, error);
    throw error;
  }
}

export async function fetchWordsByRange(startId: number, endId: number): Promise<QuranWord[]> {
  const db = await getDb();
  const query = `
    SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya, can_stop
    FROM quran_words 
    WHERE id BETWEEN ? AND ?
    ORDER BY id ASC;
  `;
  try {
    return await db.getAllAsync<QuranWord>(query, [startId, endId]);
  } catch (error) {
    console.error("❌ Error fetching words by range:", error);
    throw error;
  }
}

export async function fetchWordRangeForSurah(surahId: number) {
  const db = await getDb();
  const query = `
    SELECT MIN(id) as start, MAX(id) as end
    FROM quran_words
    WHERE sura_id = ?;
  `;
  return await db.getFirstAsync<{ start: number; end: number }>(query, [surahId]);
}

export async function fetchWordRangeForPage(pageId: number) {
  const db = await getDb();
  const query = `
    SELECT MIN(id) as start, MAX(id) as end
    FROM quran_words
    WHERE page_id = ?;
  `;
  return await db.getFirstAsync<{ start: number; end: number }>(query, [pageId]);
}


/**
 * Return distinct (sura_id, aya_number) pairs for words with id between startId and endId.
 * Results are ordered by sura_id, aya_number so pagination is by aya.
 */
export async function fetchDistinctAyasInRange(
  startId: number,
  endId: number,
  offset: number,
  limit: number
): Promise<{ sura_id: number; aya_number: number }[]> {
  const db = await getDb();
  const query = `
    SELECT DISTINCT sura_id, aya_number
    FROM quran_words
    WHERE id BETWEEN ? AND ?
    ORDER BY sura_id ASC, aya_number ASC
    LIMIT ? OFFSET ?;
  `;
  try {
    return await db.getAllAsync<{ sura_id: number; aya_number: number }>(
      query,
      [startId, endId, limit, offset]
    );
  } catch (error) {
    console.error("❌ Error fetching distinct ayas:", error);
    throw error;
  }
}

/**
 * Fetch all words for a list of (sura_id, aya_number) pairs.
 * Returns words ordered by sura_id, aya_number, id.
 */
export async function fetchWordsForAyaPairs(
  pairs: { sura_id: number; aya_number: number }[]
): Promise<QuranWord[]> {
  if (!pairs || pairs.length === 0) return [];

  const db = await getDb();

  // Build WHERE clause: (sura_id = ? AND aya_number = ?) OR ...
  const whereParts = pairs.map(() => "(sura_id = ? AND aya_number = ?)").join(" OR ");
  const params: any[] = [];
  pairs.forEach((p) => {
    params.push(p.sura_id, p.aya_number);
  });

  const query = `
    SELECT id, sura_id, aya_number, page_id, text, is_end_of_aya, can_stop
    FROM quran_words
    WHERE ${whereParts}
    ORDER BY sura_id ASC, aya_number ASC, id ASC;
  `;

  try {
    return await db.getAllAsync<QuranWord>(query, params);
  } catch (error) {
    console.error("❌ Error fetching words for aya pairs:", error);
    throw error;
  }
}