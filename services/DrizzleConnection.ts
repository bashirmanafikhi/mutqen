// src/services/DrizzleConnection.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

let dbInstance: ReturnType<typeof drizzle> | null = null;

// =============================
// Constants
// =============================
const DB_NAME = "quran_database_v6.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

// =============================
// Helper - Copy database if needed
// =============================
export async function ensureDatabaseExists(): Promise<void> {
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;

  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    console.log("📦 Copying Quran database from assets...");

    const asset = Asset.fromModule(require(`../assets/${DB_NAME}`));
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
 * Returns SQLite Database connection (auto initializes if needed).
 * This is the sole source for the database connection object.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  await ensureDatabaseExists();
  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

export async function getDrizzleDb() {
  if (dbInstance) return dbInstance;
  // ensure DB file exists first (runs your copy logic)
  await ensureDatabaseExists();

  // open the DB — match name you used when copying (for expo-sqlite the name is used)
  const expoDb = SQLite.openDatabaseSync(DB_NAME);
  const db = drizzle(expoDb);
  dbInstance = db;
  return dbInstance;
}
