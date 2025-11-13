import { quran_words } from "@/db/schema";
import { asc } from 'drizzle-orm';
import { QuranPage } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches a list of all distinct page IDs available in the Quran words table.
 * Corresponds to: SELECT DISTINCT page_id AS id FROM quran_words ORDER BY page_id ASC;
 */
export async function fetchAllPages(): Promise<QuranPage[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      // FIX: Use selectDistinct for column aliasing + DISTINCT clause
      .selectDistinct({ 
        // Select page_id and alias it to 'id' to match the QuranPage model
        id: quran_words.page_id,
      })
      .from(quran_words)
      .orderBy(
        // ORDER BY page_id ASC
        asc(quran_words.page_id)
      );
      
    // The result shape matches QuranPage { id: number }
    return data as QuranPage[];
    
  } catch (error) {
    console.error("❌ Error fetching pages:", error);
    throw error;
  }
}