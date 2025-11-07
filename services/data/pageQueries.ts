import { QuranPage } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchAllPages(): Promise<QuranPage[]> {
  const db = await getDb();
  const query = `
    SELECT DISTINCT page_id AS id 
    FROM quran_words 
    ORDER BY page_id ASC;
  `;
  try {
    return await db.getAllAsync<QuranPage>(query);
  } catch (error) {
    console.error("❌ Error fetching pages:", error);
    throw error;
  }
}
