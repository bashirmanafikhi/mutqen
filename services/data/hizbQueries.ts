import { QuranDivision } from "../../models/QuranModels";
// Assuming this is where your Drizzle client getter is located
import { quran_divisions } from "@/db/schema"; // Import the Drizzle schema table
import { asc, inArray } from 'drizzle-orm';
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches all Hizbs and Quarter-Hizbs from the quran_divisions table.
 */
export async function fetchAllHizbs(): Promise<QuranDivision[]> {
  // Use the provided Drizzle client getter
  const db = await getDrizzleDb(); 
  
  try {
    const data = await db
      .select({
        // Select specific columns to match the QuranDivision interface
        id: quran_divisions.id,
        type: quran_divisions.type,
        name: quran_divisions.name,
        first_word_id: quran_divisions.first_word_id,
        last_word_id: quran_divisions.last_word_id,
      })
      .from(quran_divisions)
      .where(
        // WHERE type IN ('hizb', 'quarter-hizb')
        inArray(quran_divisions.type, ['hizb', 'quarter-hizb'])
      )
      .orderBy(
        // ORDER BY id ASC
        asc(quran_divisions.id)
      );
      
    // Drizzle's select function returns an array of objects matching the shape defined.
    // We cast it to QuranDivision[] for type safety.
    return data as QuranDivision[];
    
  } catch (error) {
    console.error("❌ Error fetching hizbs:", error);
    throw error;
  }
}