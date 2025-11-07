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
