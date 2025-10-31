// src/services/SpacedRepetitionService.ts

import { UserProgress } from "../models/QuranModels";

const calculateNewInterval = (interval: number, easeFactor: number, quality: number): number => {
    if (quality >= 3) { // Correctly guessed (Good, Easy, Very Easy)
        if (interval === 0) return 1; // First success
        if (interval === 1) return 6; // Second success
        return Math.ceil(interval * easeFactor);
    }
    // Failed/Hard (1 or 2) - Reset interval
    return 1;
};

const calculateNewEaseFactor = (easeFactor: number, quality: number): number => {
    // Quality: 5 = Very Easy, 4 = Easy, 3 = Good, 2 = Hard, 1 = Incorrect
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    // Clamp the ease factor between 1.3 and 3.0
    return Math.max(1.3, newEaseFactor); 
};

/**
 * Calculates the next review parameters based on user response quality.
 * @param currentProgress Existing progress object or null for a new word.
 * @param quality 5 (Very Easy/Correct) to 1 (Incorrect/Failed).
 * @returns Updated UserProgress object.
 */
export function getUpdatedProgress(currentProgress: UserProgress | null, quality: number): UserProgress {
    
    // Initialize default progress for a new word
    let progress: UserProgress = currentProgress || {
        word_id: 0, // Will be set by the caller
        current_interval: 0,
        review_count: 0,
        ease_factor: 2.5,
        next_review_date: new Date().toISOString(),
        last_review_date: new Date().toISOString(),
    };

    // 1. Calculate new ease factor (only for qualities 3, 4, 5)
    if (quality >= 3) {
        progress.ease_factor = calculateNewEaseFactor(progress.ease_factor, quality);
    }

    // 2. Calculate new interval
    progress.current_interval = calculateNewInterval(progress.current_interval, progress.ease_factor, quality);

    // 3. Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + progress.current_interval);
    
    // 4. Update stats
    progress.review_count += 1;
    progress.last_review_date = new Date().toISOString();
    progress.next_review_date = nextReviewDate.toISOString();

    return progress;
}