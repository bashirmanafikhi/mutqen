import { Surah } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchAllSurahs(): Promise<Surah[]> {
  const db = await getDb();
  const query = `
    SELECT id, name, name_without_tashkeel, page_id, first_word_id, last_word_id, aya_count, revelation_place 
    FROM quran_suras 
    ORDER BY id ASC;
  `;
  try {
    return await db.getAllAsync<Surah>(query);
  } catch (error) {
    console.error("❌ Error fetching surahs:", error);
    throw error;
  }
}
