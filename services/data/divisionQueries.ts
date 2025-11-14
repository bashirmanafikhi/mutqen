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

/**
 * @name fetchDivisionById
 * @description Fetches a single Quran division based on its unique ID.
 * @param divisionId The ID of the division to fetch (e.g., 0 for a special division).
 * @returns A Promise resolving to the QuranDivision object, or null if not found.
 */
export async function fetchDivisionById(divisionId: number): Promise<QuranDivision | null> {
  const db = await getDrizzleDb(); 

  try {
    const result = await db
      .select({
        id: quran_divisions.id,
        type: quran_divisions.type,
        name: quran_divisions.name,
        first_word_id: quran_divisions.first_word_id,
        last_word_id: quran_divisions.last_word_id,
      })
      .from(quran_divisions)
      .where(
        // استخدام شرط التساوي (eq) على حقل ID
        eq(quran_divisions.id, divisionId) 
      )
      // LIMIT 1 - بالرغم من أن Drizzle قد لا يحتوي على دالة limit() مباشرة، 
      // إلا أن جلب نتيجة واحدة هو السلوك المتوقع هنا.
      .limit(1); 
      
    // إذا كانت النتيجة تحتوي على صفوف، قم بإرجاع الصف الأول (الذي يمثل الـ division)
    if (result.length > 0) {
      return result[0] as QuranDivision;
    }

    // إذا لم يتم العثور على أي نتيجة
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching division with ID ${divisionId}:`, error);
    throw error;
  }
}

export async function fetchQuranDivision(): Promise<QuranDivision | null> {
    return fetchDivisionById(0);
}