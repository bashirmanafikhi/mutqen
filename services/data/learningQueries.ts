import { user_learnings } from "@/db/schema";
import { desc, eq } from 'drizzle-orm';
import { UserLearning } from "../../models/QuranModels";
import { getDrizzleDb } from "../DrizzleConnection";

/**
 * Fetches all user learning sessions, ordered by creation date descending.
 * Corresponds to: SELECT id, title, first_word_id, last_word_id, created_at FROM user_learnings ORDER BY created_at DESC;
 */
export async function fetchAllLearnings(): Promise<UserLearning[]> {
  const db = await getDrizzleDb();
  
  try {
    const data = await db
      .select({
        id: user_learnings.id,
        title: user_learnings.title,
        first_word_id: user_learnings.first_word_id,
        last_word_id: user_learnings.last_word_id,
        created_at: user_learnings.created_at,
      })
      .from(user_learnings)
      .orderBy(desc(user_learnings.created_at)); // ORDER BY created_at DESC
      
    // The result shape matches UserLearning
    return data as UserLearning[];
    
  } catch (error) {
    console.error("❌ Error fetching user learnings:", error);
    throw error;
  }
}

/**
 * Inserts a new learning session and returns the newly created record.
 * Uses .returning() to get the full object including the auto-generated ID and created_at.
 * Corresponds to: INSERT INTO user_learnings (title, first_word_id, last_word_id) VALUES (?, ?, ?);
 */
export async function insertNewLearning(
  title: string, 
  startWordId: number, 
  endWordId: number
): Promise<UserLearning> {
  const db = await getDrizzleDb();

  try {
    const result = await db.insert(user_learnings)
      .values({
        title: title,
        first_word_id: startWordId,
        last_word_id: endWordId,
      })
      .returning({
        // Select all columns to match the UserLearning interface
        id: user_learnings.id,
        title: user_learnings.title,
        first_word_id: user_learnings.first_word_id,
        last_word_id: user_learnings.last_word_id,
        created_at: user_learnings.created_at,
      });

    // The result is an array containing the inserted object
    const newLearning = result[0];

    if (!newLearning) {
      // Drizzle should guarantee a return, but good to check.
      throw new Error("Failed to retrieve new learning record after insertion.");
    }
    
    return newLearning as UserLearning;

  } catch (error) {
    console.error("❌ Error inserting new learning:", error);
    throw error;
  }
}

/**
 * Deletes a learning session by its ID.
 * Corresponds to: DELETE FROM user_learnings WHERE id = ?
 */
export async function deleteLearningById(id: number): Promise<void> {
  const db = await getDrizzleDb();
  
  try {
    await db.delete(user_learnings)
      .where(eq(user_learnings.id, id)); // WHERE id = ?
      
  } catch (error) {
    console.error(`❌ Error deleting learning item ID ${id}:`, error);
    throw error;
  }
}