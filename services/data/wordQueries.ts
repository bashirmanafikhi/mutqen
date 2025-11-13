import { quran_words } from "@/db/schema"; // Import the Drizzle schema table
import { and, asc, between, eq, or, sql } from 'drizzle-orm';
import { QuranWord } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

// Define the shape for aggregate results (MIN/MAX)
interface WordRange {
  start: number;
  end: number;
}

// Define the columns to be selected for QuranWord results
const wordColumns = {
  id: quran_words.id,
  sura_id: quran_words.sura_id,
  aya_number: quran_words.aya_number,
  page_id: quran_words.page_id,
  text: quran_words.text,
  is_end_of_aya: quran_words.is_end_of_aya,
  can_stop: quran_words.can_stop,
};

/**
 * Fetches all words belonging to a specific Surah ID.
 * Corresponds to: SELECT ... FROM quran_words WHERE sura_id = ? ORDER BY id ASC;
 */
export async function fetchWordsBySurahId(suraId: number): Promise<QuranWord[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .select(wordColumns)
      .from(quran_words)
      .where(eq(quran_words.sura_id, suraId)) // WHERE sura_id = ?
      .orderBy(asc(quran_words.id)); // ORDER BY id ASC

    return data as QuranWord[];
  } catch (error) {
    console.error(`❌ Error fetching words for surah ${suraId}:`, error);
    throw error;
  }
}

/**
 * Fetches all words within a specific word ID range.
 * Corresponds to: SELECT ... FROM quran_words WHERE id BETWEEN ? AND ? ORDER BY id ASC;
 */
export async function fetchWordsByRange(startId: number, endId: number): Promise<QuranWord[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .select(wordColumns)
      .from(quran_words)
      .where(between(quran_words.id, startId, endId)) // WHERE id BETWEEN ? AND ?
      .orderBy(asc(quran_words.id)); // ORDER BY id ASC
      
    return data as QuranWord[];
  } catch (error) {
    console.error("❌ Error fetching words by range:", error);
    throw error;
  }
}

/**
 * Fetches the minimum and maximum word ID for a given Surah.
 * Corresponds to: SELECT MIN(id) as start, MAX(id) as end FROM quran_words WHERE sura_id = ?;
 */
export async function fetchWordRangeForSurah(surahId: number): Promise<WordRange | null> {
  const db = await getDrizzleDb();
  
  const result = await db
    .select({
      start: sql<number>`min(${quran_words.id})`.as('start'),
      end: sql<number>`max(${quran_words.id})`.as('end'),
    })
    .from(quran_words)
    .where(eq(quran_words.sura_id, surahId));

  // Drizzle returns an array, return the first element or null if empty
  return (result[0] as WordRange) || null;
}

/**
 * Fetches the minimum and maximum word ID for a given Quran page.
 * Corresponds to: SELECT MIN(id) as start, MAX(id) as end FROM quran_words WHERE page_id = ?;
 */
export async function fetchWordRangeForPage(pageId: number): Promise<WordRange | null> {
  const db = await getDrizzleDb();
  
  const result = await db
    .select({
      start: sql<number>`min(${quran_words.id})`.as('start'),
      end: sql<number>`max(${quran_words.id})`.as('end'),
    })
    .from(quran_words)
    .where(eq(quran_words.page_id, pageId));

  // Drizzle returns an array, return the first element or null if empty
  return (result[0] as WordRange) || null;
}


/**
 * Return distinct (sura_id, aya_number) pairs for words with id between startId and endId.
 * Results are ordered by sura_id, aya_number so pagination is by aya.
 * Corresponds to: SELECT DISTINCT sura_id, aya_number ... LIMIT ? OFFSET ?;
 */
export async function fetchDistinctAyasInRange(
  startId: number,
  endId: number,
  offset: number,
  limit: number
): Promise<{ sura_id: number; aya_number: number }[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .selectDistinct({
        sura_id: quran_words.sura_id,
        aya_number: quran_words.aya_number,
      })
      .from(quran_words)
      .where(between(quran_words.id, startId, endId))
      .orderBy(asc(quran_words.sura_id), asc(quran_words.aya_number))
      .limit(limit)
      .offset(offset);

    return data as { sura_id: number; aya_number: number }[];
  } catch (error) {
    console.error("❌ Error fetching distinct ayas:", error);
    throw error;
  }
}

/**
 * Fetch all words for a list of (sura_id, aya_number) pairs using Drizzle's 'or' helper.
 * Returns words ordered by sura_id, aya_number, id.
 * Corresponds to: WHERE (sura_id = ? AND aya_number = ?) OR ...
 */
export async function fetchWordsForAyaPairs(
  pairs: { sura_id: number; aya_number: number }[]
): Promise<QuranWord[]> {
  if (!pairs || pairs.length === 0) return [];

  const db = await getDrizzleDb();

  // Dynamically create the list of conditions: (sura_id = x AND aya_number = y)
  const pairConditions = pairs.map(pair => 
    and(
      eq(quran_words.sura_id, pair.sura_id),
      eq(quran_words.aya_number, pair.aya_number)
    )
  );

  try {
    const data = await db
      .select(wordColumns)
      .from(quran_words)
      .where(
        // Combine all pair conditions using the OR operator
        or(...pairConditions)
      )
      .orderBy(
        // ORDER BY sura_id ASC, aya_number ASC, id ASC
        asc(quran_words.sura_id),
        asc(quran_words.aya_number),
        asc(quran_words.id)
      );

    return data as QuranWord[];
  } catch (error) {
    console.error("❌ Error fetching words for aya pairs:", error);
    throw error;
  }
}