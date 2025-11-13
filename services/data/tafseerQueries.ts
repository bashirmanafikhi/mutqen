import { aya_tafseers } from "@/db/schema"; // Import the Drizzle schema table
import { and, asc, between, eq, or } from 'drizzle-orm';
import { AyaTafseer } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches a single tafseer record by Sura ID and Aya Number.
 * Corresponds to: SELECT ... FROM aya_tafseers WHERE sura_id = ? AND aya_number = ? LIMIT 1;
 */
export async function fetchTafseerByAya(suraId: number, ayaNumber: number): Promise<AyaTafseer | null> {
  const db = await getDrizzleDb();
  
  try {
    const result = await db
      .select({
        sura_id: aya_tafseers.sura_id,
        aya_number: aya_tafseers.aya_number,
        text: aya_tafseers.text,
      })
      .from(aya_tafseers)
      .where(
        // WHERE sura_id = ? AND aya_number = ?
        and(
          eq(aya_tafseers.sura_id, suraId),
          eq(aya_tafseers.aya_number, ayaNumber)
        )
      )
      .limit(1); // LIMIT 1

    // Drizzle returns an array, return the first element or null if empty
    return (result[0] as AyaTafseer) || null;
  } catch (error) {
    console.error("❌ Error fetching tafseer by aya:", error);
    throw error;
  }
}

/**
 * Fetches a range of tafseers within a specific Sura ID.
 * Corresponds to: SELECT ... FROM aya_tafseers WHERE sura_id = ? AND aya_number BETWEEN ? AND ? ORDER BY aya_number ASC;
 */
export async function fetchTafseersByRange(
  suraId: number, 
  startAya: number, 
  endAya: number
): Promise<AyaTafseer[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .select({
        sura_id: aya_tafseers.sura_id,
        aya_number: aya_tafseers.aya_number,
        text: aya_tafseers.text,
      })
      .from(aya_tafseers)
      .where(
        // WHERE sura_id = ? AND aya_number BETWEEN ? AND ?
        and(
          eq(aya_tafseers.sura_id, suraId),
          between(aya_tafseers.aya_number, startAya, endAya)
        )
      )
      .orderBy(
        // ORDER BY aya_number ASC
        asc(aya_tafseers.aya_number)
      );
      
    return data as AyaTafseer[];
  } catch (error) {
    console.error("❌ Error fetching tafseers by range:", error);
    throw error;
  }
}


/**
 * Fetch tafseers for a list of pairs (sura_id, aya_number).
 * Returns array of AyaTafseer.
 * Corresponds to: WHERE (sura_id = ? AND aya_number = ?) OR (...)
 */
export async function fetchTafseersForAyaPairs(
  pairs: { sura_id: number; aya_number: number }[]
): Promise<AyaTafseer[]> {
  if (!pairs || pairs.length === 0) return [];

  const db = await getDrizzleDb();

  // Dynamically create the list of conditions: (sura_id = x AND aya_number = y)
  const pairConditions = pairs.map(pair => 
    and(
      eq(aya_tafseers.sura_id, pair.sura_id),
      eq(aya_tafseers.aya_number, pair.aya_number)
    )
  );

  try {
    const data = await db
      .select({
        sura_id: aya_tafseers.sura_id,
        aya_number: aya_tafseers.aya_number,
        text: aya_tafseers.text,
      })
      .from(aya_tafseers)
      .where(
        // Combine all pair conditions using the OR operator
        or(...pairConditions)
      )
      .orderBy(
        // ORDER BY sura_id ASC, aya_number ASC
        asc(aya_tafseers.sura_id),
        asc(aya_tafseers.aya_number)
      );

    return data as AyaTafseer[];
  } catch (error) {
    console.error("❌ Error fetching tafseers for aya pairs:", error);
    throw error;
  }
}