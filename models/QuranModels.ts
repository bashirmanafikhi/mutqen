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
  start_word_id: number;
  end_word_id: number;
  created_at: string; // DATETIME is often mapped to a string in JS
}

// =============================
// Interfaces for App State
// =============================

/**
 * Represents a learning item combined with its identifying information 
 * (useful for displaying in the list).
 */
export interface LearningItemDisplay extends UserLearning {
    // Add display fields derived from foreign keys
    display_text: string; 
    sura_name: string;
    start_aya: number;
    end_aya: number;
}

/**
 * Interface for a record from the 'user_progress' table.
 */
export interface UserProgress {
    word_id: number;
    current_interval: number; // in days
    review_count: number;
    ease_factor: number; // usually starts at 2.5
    next_review_date: string; // ISO date string
    last_review_date: string; // ISO date string
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
}