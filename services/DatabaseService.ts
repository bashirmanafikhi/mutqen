// services/DatabaseService.ts
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

// =============================
// Interfaces
// =============================
export interface Surah {
  id: number;
  name: string;
  aya_count: number;
  revelation_place: string;
}

export interface QuranWord {
  word_id: number;
  sura_id: number;
  aya_id: number;
  page_id: number;
  text: string;
  is_end_of_aya: number;
}

// =============================
// Constants
// =============================
const DB_NAME = "quran_database.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

// =============================
// Helper - Copy database if needed
// =============================
async function ensureDatabaseExists(): Promise<void> {
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;

  // تأكد أن مجلد SQLite موجود
  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  // تحقق من وجود قاعدة البيانات
  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    console.log("📦 Copying Quran database from assets...");

    const asset = Asset.fromModule(require("../assets/quran_database.db"));
    await asset.downloadAsync();

    await FileSystem.copyAsync({
      from: asset.localUri!,
      to: DB_PATH,
    });

    console.log("✅ Quran database copied successfully.");
  }
}

// =============================
// Main Export
// =============================
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Return SQLite Database connection (auto initializes if needed)
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  await ensureDatabaseExists();
  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

// =============================
// Example Queries
// =============================
export async function fetchAllSurahs(): Promise<Surah[]> {
  const database = await getDb();
  const query = `
    SELECT id, name, aya_count, revelation_place 
    FROM QuranSurah 
    ORDER BY id ASC;
  `;
  try {
    return await database.getAllAsync<Surah>(query);
  } catch (error) {
    console.error("❌ Error fetching surahs:", error);
    throw error;
  }
}

export async function fetchWordsBySurahId(suraId: number): Promise<QuranWord[]> {
  const database = await getDb();
  const query = `
    SELECT word_id, sura_id, aya_id, page_id, text, is_end_of_aya
    FROM QuranWords 
    WHERE sura_id = ?
    ORDER BY word_id ASC;
  `;
  try {
    return await database.getAllAsync<QuranWord>(query, [suraId]);
  } catch (error) {
    console.error(`❌ Error fetching words for surah ${suraId}:`, error);
    throw error;
  }
}
