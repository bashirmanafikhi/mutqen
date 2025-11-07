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
