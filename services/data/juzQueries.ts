import { QuranJuz } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchAllJuzs(): Promise<QuranJuz[]> {
  const db = await getDb();
  const query = `
    SELECT id, name, first_word_id, last_word_id 
    FROM quran_juzs 
    ORDER BY id ASC;
  `;
  try {
    return await db.getAllAsync<QuranJuz>(query);
  } catch (error) {
    console.error("❌ Error fetching Juzs:", error);
    throw error;
  }
}
