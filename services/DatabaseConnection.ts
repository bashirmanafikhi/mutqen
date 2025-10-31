// src/services/DatabaseConnection.ts

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

// =============================
// Constants
// =============================
const DB_NAME = "quran_database_v2.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

// =============================
// Helper - Copy database if needed
// =============================
async function ensureDatabaseExists(): Promise<void> {
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;

  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    console.log("📦 Copying Quran database from assets...");

    const asset = Asset.fromModule(require("../assets/quran_database_v2.db"));
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