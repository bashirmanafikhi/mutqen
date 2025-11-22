// src/services/DrizzleConnection.ts

import * as Schema from '@/db/schema'; // Adjust path to your schema file
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Asset } from "expo-asset";
// 🚨 CRITICAL CHANGE: Use the legacy import to access deprecated methods safely
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

// Initialize Drizzle instance storage
let dbInstance: ReturnType<typeof drizzle<typeof Schema>> | null = null;
let dbInitializationPromise: Promise<void> | null = null;
let isInitialized = false;

// =============================
// Constants
// =============================
const DB_NAME = "quran_database_v6.db";
// Use FileSystem.documentDirectory (now safely accessed via /legacy)
const SQLITE_DIRECTORY_PATH = `${FileSystem.documentDirectory}SQLite`;
const DB_PATH = `${SQLITE_DIRECTORY_PATH}/${DB_NAME}`;

// =============================
// Helper - Copy database if needed (Legacy API Implementation)
// =============================
export async function ensureDatabaseExists(): Promise<void> {
    console.log("Starting database check and copy...");

    // 1. Ensure the SQLite directory exists
    // Use the safe FileSystem.getInfoAsync
    let dirInfo = await FileSystem.getInfoAsync(SQLITE_DIRECTORY_PATH);

    if (!dirInfo.exists) {
        console.log("📁 Creating SQLite directory...");
        // Use the safe FileSystem.makeDirectoryAsync
        await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY_PATH, { intermediates: true });
    }

    // 2. Check if the database file exists
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);

    if (!fileInfo.exists) {
        console.log("📦 Copying Quran database from assets...");

        // 3. Get the asset object
        const asset = Asset.fromModule(require(`../assets/${DB_NAME}`));

        // 4. Ensure the asset is downloaded
        await asset.downloadAsync();

        // 5. Copy the local URI to the final destination
        if (asset.localUri) {
            // Use the safe FileSystem.copyAsync
            await FileSystem.copyAsync({
                from: asset.localUri,
                to: DB_PATH,
            });
            console.log("✅ Quran database copied successfully.");
        } else {
            console.error("❌ Failed to get local URI for database asset.");
            throw new Error("Database asset could not be located after download.");
        }
    } else {
        console.log("✅ Database file already exists.");
    }
}

// =============================
// Main Exports
// =============================
/**
 * Returns the Expo SQLite Database connection (SQLite.SQLiteDatabase).
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    await ensureDatabaseExists();
    return await SQLite.openDatabaseAsync(DB_NAME);
}

/**
 * Returns the Drizzle ORM instance connected via Expo SQLite adapter.
 * Ensures database is initialized before returning the instance.
 */
export async function getDrizzleDb(): Promise<ReturnType<typeof drizzle<typeof Schema>>> {
    // If already initialized, return cached instance
    if (dbInstance && isInitialized) return dbInstance;

    // If initialization is in progress, wait for it
    if (dbInitializationPromise) {
        await dbInitializationPromise;
        return dbInstance!;
    }

    // Start initialization and cache the promise to prevent concurrent initializations
    dbInitializationPromise = initializeDrizzleDb();
    await dbInitializationPromise;

    return dbInstance!;
}

/**
 * Private function to handle the actual initialization logic
 */
async function initializeDrizzleDb(): Promise<void> {
    try {
        // Ensure database file exists and is copied
        await ensureDatabaseExists();
        
        // Open the database synchronously (safe now that file exists)
        const expoDb = SQLite.openDatabaseSync(DB_NAME);
        
        // Verify connection is valid
        if (!expoDb) {
            throw new Error("Failed to open database - connection is null");
        }

        // Create Drizzle instance
        dbInstance = drizzle(expoDb, { schema: Schema });
        isInitialized = true;
        
        console.log("✅ Database successfully initialized");
    } catch (err) {
        console.error("❌ Failed to initialize database:", err);
        isInitialized = false;
        dbInitializationPromise = null;
        throw err;
    }
}