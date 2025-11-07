import { UserLearning } from "../../models/QuranModels";
import { getDb } from "../DatabaseConnection";

export async function fetchAllLearnings(): Promise<UserLearning[]> {
  const db = await getDb();
  const query = `
    SELECT id, title, first_word_id, last_word_id, created_at
    FROM user_learnings 
    ORDER BY created_at DESC;
  `;
  try {
    return await db.getAllAsync<UserLearning>(query);
  } catch (error) {
    console.error("❌ Error fetching user learnings:", error);
    throw error;
  }
}

export async function insertNewLearning(title: string, startWordId: number, endWordId: number): Promise<UserLearning> {
    const database = await getDb();
    const query = `
        INSERT INTO user_learnings (title, first_word_id, last_word_id)
        VALUES (?, ?, ?);
    `;
    try {
        const result = await database.runAsync(query, [title, startWordId, endWordId]);

        if (result.lastInsertRowId === undefined) {
            throw new Error("Failed to retrieve new learning ID.");
        }

        // Fetch the newly inserted row to get created_at and the actual ID
        const newLearning = await database.getFirstAsync<UserLearning>(
            `SELECT id, title, first_word_id, last_word_id, created_at FROM user_learnings WHERE id = ?`,
            [result.lastInsertRowId]
        );

        if (!newLearning) throw new Error("Could not fetch inserted row.");
        
        return newLearning;

    } catch (error) {
        console.error("❌ Error inserting new learning:", error);
        throw error;
    }
}

export async function deleteLearningById(id: number) {
  const db = await getDb();
  const query = `DELETE FROM user_learnings WHERE id = ?`;
  try {
    await db.runAsync(query, [id]);
  } catch (error) {
    console.error(`❌ Error deleting learning item ID ${id}:`, error);
    throw error;
  }
}
