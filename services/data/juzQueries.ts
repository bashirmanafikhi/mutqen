import { quran_juzs } from "@/db/schema"; // Import the Drizzle schema table
import { asc } from 'drizzle-orm';
import { QuranJuz } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches all Juzs (30 parts) from the quran_juzs table.
 */
export async function fetchAllJuzs(): Promise<QuranJuz[]> {
  const db = await getDrizzleDb(); 

  try {
    const data = await db
      .select({
        // SELECT id, name, first_word_id, last_word_id
        id: quran_juzs.id,
        name: quran_juzs.name,
        first_word_id: quran_juzs.first_word_id,
        last_word_id: quran_juzs.last_word_id,
      })
      .from(quran_juzs) 
      .orderBy(
        // ORDER BY id ASC
        asc(quran_juzs.id)
      );
      
    // The result is cast to QuranJuz[] to match the function's return type.
    return data as QuranJuz[];
    
  } catch (error) {
    console.error("❌ Error fetching Juzs:", error);
    throw error;
  }
}