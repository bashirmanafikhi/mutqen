import { QuranDivision } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchAllHizbs(): Promise<QuranDivision[]> {
  const db = await getDb();
  const query = `
    SELECT id, type, name, first_word_id, last_word_id
    FROM quran_divisions
    WHERE type IN ('hizb', 'quarter-hizb')
    ORDER BY id ASC;
  `;
  try {
    return await db.getAllAsync<QuranDivision>(query);
  } catch (error) {
    console.error("❌ Error fetching hizbs:", error);
    throw error;
  }
}
