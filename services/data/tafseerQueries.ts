import { AyaTafseer } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchTafseerByAya(suraId: number, ayaNumber: number): Promise<AyaTafseer | null> {
  const db = await getDb();
  const query = `
    SELECT sura_id, aya_number, text
    FROM aya_tafseers
    WHERE sura_id = ? AND aya_number = ?
    LIMIT 1;
  `;
  try {
    const result = await db.getFirstAsync<AyaTafseer>(query, [suraId, ayaNumber]);
    return result || null;
  } catch (error) {
    console.error("❌ Error fetching tafseer by aya:", error);
    throw error;
  }
}

export async function fetchTafseersByRange(suraId: number, startAya: number, endAya: number): Promise<AyaTafseer[]> {
  const db = await getDb();
  const query = `
    SELECT sura_id, aya_number, text
    FROM aya_tafseers
    WHERE sura_id = ? AND aya_number BETWEEN ? AND ?
    ORDER BY aya_number ASC;
  `;
  try {
    return await db.getAllAsync<AyaTafseer>(query, [suraId, startAya, endAya]);
  } catch (error) {
    console.error("❌ Error fetching tafseers by range:", error);
    throw error;
  }
}


/**
 * Fetch tafseers for a list of pairs (sura_id, aya_number).
 * Returns array of AyaTafseer.
 */
export async function fetchTafseersForAyaPairs(
  pairs: { sura_id: number; aya_number: number }[]
): Promise<AyaTafseer[]> {
  if (!pairs || pairs.length === 0) return [];

  const db = await getDb();

  const whereParts = pairs.map(() => "(sura_id = ? AND aya_number = ?)").join(" OR ");
  const params: any[] = [];
  pairs.forEach((p) => {
    params.push(p.sura_id, p.aya_number);
  });

  const query = `
    SELECT sura_id, aya_number, text
    FROM aya_tafseers
    WHERE ${whereParts}
    ORDER BY sura_id ASC, aya_number ASC;
  `;

  try {
    return await db.getAllAsync<AyaTafseer>(query, params);
  } catch (error) {
    console.error("❌ Error fetching tafseers for aya pairs:", error);
    throw error;
  }
}