// src/models/TrainingModels.ts
import { WordWithProgress } from "@/services/data/TrainingQueryService";

export type TrainingMode = 'review' | 'memorization' | 'training';

export interface TrainingState {
  mode: TrainingMode;
  currentWordIndex: number;
  words: WordWithProgress[];
  revealedWords: WordWithProgress[];
  dueReviews: Map<number, string>;
  isAtCanStop: boolean;
  hasMoreDueReviews: boolean;
}

export interface TrainingStats {
  totalWords: number;
  wordsReviewed: number;
  wordsMemorized: number;
  currentStreak: number;
  accuracy: number;
  sessionStartTime: Date;
  estimatedCompletion?: Date;
}

export interface CardProps {
  word: WordWithProgress;
  isRevealed: boolean;
  onReveal: (quality: number) => void;
  onSwipe: (wordId: number, isCorrect: boolean) => void;
  mode: TrainingMode;
  showQuestionMark?: boolean;
  timer?: number;
}

export interface ProgressIndicatorProps {
  currentWordId: number;
  startId: number;
  endId: number;
  totalWords: number;
  completedWords: number;
  mode: TrainingMode;
  dueReviewsCount: number;
}

export interface ModeIndicatorProps {
  mode: TrainingMode;
  hasDueReviews: boolean;
  onSwitchMode: (mode: TrainingMode) => void;
}