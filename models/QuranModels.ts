// =============================
// Interfaces for Database Entities
// These types reflect the exact structure and nullability of the Drizzle/SQLite schema.
// =============================

/**
 * Interface for a record from the 'quran_suras' table.
 * Fields are nullable as defined in the Drizzle schema.
 */
export interface Surah {
    id: number;
    name: string | null;
    name_without_tashkeel: string | null;
    page_id: number | null;
    first_word_id: number | null;
    last_word_id: number | null;
    aya_count: number | null;
    revelation_place: string | null;
}

/**
 * Interface for a record from the 'quran_juzs' table.
 */
export interface QuranJuz {
    id: number;
    name: string;
    first_word_id: number;
    last_word_id: number;
}

/**
 * Interface for a record from the 'quran_divisions' table.
 */
export interface QuranDivision {
    id: number;
    type: string;       // "hizb" or "quarter-hizb"
    name: string;       // e.g. "Quarter 1 of Hizb 1"
    first_word_id: number;
    last_word_id: number;
}

/**
 * Interface for a record from the 'quran_words' table.
 * 'can_stop' is nullable in the DB schema.
 */
export interface QuranWord {
    id: number;
    sura_id: number;
    aya_number: number;
    page_id: number;
    text: string;
    is_end_of_aya: boolean;
    can_stop: boolean | null; // Added back as per the Drizzle schema
}

/**
 * Interface for a record from the 'quran_pages' table.
 */
export interface QuranPage {
    id: number; // Corresponds to the page number
}

/**
 * Interface for a record from the 'aya_tafseers' table.
 * 'text' is nullable in the DB schema.
 */
export interface AyaTafseer {
    sura_id: number;
    aya_number: number;
    text: string | null; // Set to nullable to match schema
}

/**
 * Interface for a record from the 'user_learnings' table.
 */
export interface UserLearning {
    id: number;
    title: string;
    first_word_id: number;
    last_word_id: number;
    created_at: string; // DATETIME is often mapped to a string in JS
}

/**
 * Interface for a record from the 'user_progress' table.
 * 'last_successful_date' and 'notes' are nullable in the DB schema.
 */
export interface UserProgress {
    created_at: string; // ISO date string
    word_id: number; // Foreign key to QuranWord.id
    current_interval: number; // in seconds
    review_count: number; // number of times reviewed
    ease_factor: number; // usually starts at 2.5
    next_review_date: string; // ISO date string
    last_review_date: string; // ISO date string
    last_successful_date: string | null; // ISO date string (nullable)
    
    /*
      0 -> (not learned)
      1 -> (weak)
      2 -> (fair)
      3 -> (good)
      4 -> (mastered)
    */
    memory_tier: number; 
    lapses: number; // number of times forgotten
    notes: string | null; // user notes (nullable)
}


// =============================
// Interfaces for App State / UI
// =============================

/**
 * Interface for a word combined with its UI state and progress.
 * Extends the QuranWord interface, inheriting its nullability.
 */
export interface WordCard extends QuranWord {
    isRevealed: boolean;
    progressStatus: 'hidden' | 'correct' | 'incorrect'; // For UI coloring
    suraName: string | null; // Inherits nullability from Surah.name
    isFirstAyaWord: boolean;
    isFirstSuraWord: boolean;
    memory_tier: number;
}