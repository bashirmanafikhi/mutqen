import { quran_divisions } from "@/db/schema"; // Import the Drizzle schema table
import { asc, eq } from 'drizzle-orm';
import { QuranDivision } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches all Sahaba Divisions (filtered by type='juz') from the quran_divisions table.
 * Corresponds to: SELECT ... FROM quran_divisions WHERE type = 'juz' ORDER BY id ASC;
 */
export async function fetchAllSahabaDivisions(): Promise<QuranDivision[]> {
  const db = await getDrizzleDb(); 
  
  try {
    const data = await db
      .select({
        // Selecting all columns needed for the QuranDivision interface
        id: quran_divisions.id,
        type: quran_divisions.type,
        name: quran_divisions.name,
        first_word_id: quran_divisions.first_word_id,
        last_word_id: quran_divisions.last_word_id,
      })
      .from(quran_divisions)
      .where(
        // WHERE type = 'juz' using the 'eq' (equals) helper
        eq(quran_divisions.type, 'juz')
      )
      .orderBy(
        // ORDER BY id ASC
        asc(quran_divisions.id)
      );
      
    // Cast the result to the desired type
    return data as QuranDivision[];
    
  } catch (error) {
    console.error("❌ Error fetching Sahaba divisions:", error);
    throw error;
  }
}