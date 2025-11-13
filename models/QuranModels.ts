// src/models/QuranModels.ts

// =============================
// Interfaces for Database Entities
// =============================

/**
 * Interface for a record from the 'quran_suras' table.
 */
export interface Surah {
  id: number;
  name: string;
  name_without_tashkeel: string;
  page_id: number;
  first_word_id: number;
  last_word_id: number;
  aya_count: number;
  revelation_place: string;
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
 * Interface for a record from the 'quran_words' table.
 */
export interface QuranWord {
  id: number;
  sura_id: number;
  aya_number: number;
  page_id: number;
  text: string;
  is_end_of_aya: boolean;
}

/**
 * Interface for a record from the 'quran_pages' table.
 */
export interface QuranPage {
  id: number; // Corresponds to the page number
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

// =============================
// Interfaces for App State
// =============================


/**
 * Interface for a record from the 'user_progress' table.
 */
export interface UserProgress {
    word_id: number; // Foreign key to QuranWord.id
    current_interval: number; // is seconds
    review_count: number; // number of times reviewed
    ease_factor: number; // usually starts at 2.5
    next_review_date: string; // ISO date string
    last_review_date: string; // ISO date string
    last_successful_date: string | null; // ISO date string
    
    /*
      0 -> (not learned)
      1 -> (weak)
      2 -> (fair)
      3 -> (good)
      4 -> (mastered
    */
    memory_tier: number; 
    lapses: number; // number of times forgotten
    notes: string | null; // user notes
}

/**
 * Interface for a word combined with its UI state and progress.
 */
export interface WordCard extends QuranWord {
    isRevealed: boolean;
    progressStatus: 'hidden' | 'correct' | 'incorrect'; // For UI coloring
    suraName: string; // For display
    isFirstAyaWord: boolean;
    isFirstSuraWord: boolean;
    memory_tier: number;
}


export interface AyaTafseer {
  sura_id: number;
  aya_number: number;
  text: string;
}

export interface QuranDivision {
  id: number;
  type: string;       // "hizb" or "quarter-hizb"
  name: string;       // e.g. "Quarter 1 of Hizb 1"
  first_word_id: number;
  last_word_id: number;
}