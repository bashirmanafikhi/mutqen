// src/components/training/TrainingSession.tsx
import ProgressIndicator from '@/components/training/ProgressIndicator';
import RevealedList from '@/components/training/RevealedList';
import TrainingCard from '@/components/training/TrainingCard';
import { useSettings } from '@/context/AppSettingContext';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { WordWithProgress } from '@/services/data/TrainingQueryService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import CompletionScreen from './CompletionScreen';

interface TrainingSessionProps {
  startWordId: number;
  endWordId: number;
  title?: string;
}

const TrainingSession: React.FC<TrainingSessionProps> = ({
  startWordId,
  endWordId,
  title
}) => {
  const { t } = useTranslation();
  const { isDark } = useSettings();
  const [modeTransition, setModeTransition] = useState<{
    isTransitioning: boolean;
    fromMode?: string;
    toMode?: string;
  }>({ isTransitioning: false });

  const {
    // State
    isInitializing,
    currentWord,
    revealedWords,
    state,
    stats,
    reviewDetector,

    // Actions
    updateProgress,
    switchToReviewMode,
    jumpToReviewWithContext,
    jumpToLatestSaved,
    restartSession,

    // Status
    canContinue,
    isFinished,
    hasDueReviews
  } = useTrainingSession({
    startId: startWordId,
    endId: endWordId,
    batchSize: 20
  });

  const handleReveal = useCallback((quality: number) => {
    updateProgress(quality);
  }, [updateProgress]);

  const handleSwipe = useCallback((wordId: number, isCorrect: boolean) => {
    const quality = isCorrect ? 5 : 1;
    updateProgress(quality);
  }, [updateProgress]);

  // Navigate to the first due review word with context
  const handleSwitchToReviewMode = useCallback(() => {
    const nextReview = reviewDetector.getNextDueReview?.();
    if (!nextReview) return;

    setModeTransition({
      isTransitioning: true,
      fromMode: state.mode,
      toMode: 'review'
    });

    // Show transition for 500ms then navigate to review word
    setTimeout(() => {
      jumpToReviewWithContext(nextReview.word_id, 3); // Show 3 words before for context
      setModeTransition({ isTransitioning: false });
    }, 500);
  }, [state.mode, jumpToReviewWithContext, reviewDetector]);

  // Navigate to the latest saved word in memorization mode
  const handleJumpToLatestSaved = useCallback(() => {
    // Show transition overlay when switching back to memorization
    setModeTransition({
      isTransitioning: true,
      fromMode: state.mode,
      toMode: 'memorization'
    });

    setTimeout(() => {
      jumpToLatestSaved(startWordId, endWordId);
      setModeTransition({ isTransitioning: false });
    }, 500);
  }, [jumpToLatestSaved, startWordId, endWordId, state.mode]);

  const handleWordPress = useCallback((word: WordWithProgress) => {
    // TODO: Implement word details view if needed
  }, []);

  if (isInitializing) {
    return (
      <View className="flex-1 mt-10 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <View className="items-center">
          <Ionicons
            name="book"
            size={64}
            color={isDark ? "#818CF8" : "#6366F1"}
          />
          <Text className="text-xl font-bold text-gray-700 dark:text-gray-200 mt-4">
            {t('training.preparing_session')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center px-8">
            {t('training.loading_words')}
          </Text>

          {/* Add a small loading indicator */}
          <View className="mt-4">
            <Ionicons
              name="reload"
              size={24}
              color={isDark ? "#818CF8" : "#6366F1"}
            />
          </View>
        </View>
      </View>
    );
  }

  // Add a fallback for when there are no words but loading is complete
  if (!isInitializing && state.words.length === 0 && !currentWord) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <View className="items-center">
          <Ionicons
            name="school"
            size={64}
            color={isDark ? "#818CF8" : "#6366F1"}
          />
          <Text className="text-xl font-bold text-gray-700 dark:text-gray-200 mt-4">
            {t('training.free_training_title')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center px-8">
            {t('training.all_words_complete_message')}
          </Text>

          {/* Add a small loading indicator */}
          <View className="mt-4">
            <Ionicons
              name="reload"
              size={24}
              color={isDark ? "#818CF8" : "#6366F1"}
            />
          </View>
        </View>
      </View>
    );
  }

  if (isFinished) {
    return (
      <CompletionScreen
        stats={stats}
        totalWords={revealedWords.length}
        onRestart={restartSession}
        startId={startWordId}
        endId={endWordId}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className={`pt-4 px-4 pb-2 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </Text>

          <View className="flex-row space-x-2">
            {/* place holder for Toggle Buttons */}
          </View>
        </View>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentWordId={currentWord?.id || startWordId}
          startId={startWordId}
          endId={endWordId}
          totalWords={state.words.length}
          completedWords={revealedWords.length}
          mode={state.mode}
          dueReviewsCount={reviewDetector.dueReviews.size}
        />
      </View>

      {/* Mode Transition Overlay */}
      {modeTransition.isTransitioning && (
        <View className="absolute inset-0 bg-black bg-opacity-70 z-50 justify-center items-center">
          <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'
            } items-center`}>
            <Ionicons
              name="refresh"
              size={48}
              color={isDark ? "#818CF8" : "#6366F1"}
            />
            <Text className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              {t('training.transition_title')}
            </Text>
            <Text className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              {t('training.loading_words')}
            </Text>
          </View>
        </View>
      )}

      {/* Main Content Area - Fixed layout to prevent overlapping */}
      <View className="flex-1">
        {/* Revealed List Section - Takes most space */}
        <View className="flex-1 px-4 py-3">
          <RevealedList
            revealedWords={revealedWords}
            onWordPress={handleWordPress}
          />
        </View>

        {/* Training Card Section - Fixed at bottom */}
        <View className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pt-4">
          <View className="px-6 pb-4">
            {currentWord ? (
              <TrainingCard
                word={currentWord}
                isRevealed={false}
                onReveal={handleReveal}
                onSwipe={handleSwipe}
                mode={state.mode}
                showQuestionMark={true}
                timer={5}
              />
            ) : (
              <View className="items-center py-4">
                <Ionicons
                  name="alert-circle-outline"
                  size={32}
                  color={isDark ? "#6B7280" : "#9CA3AF"}
                />
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  {t('training.no_more_words')}
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            <View className="flex-row justify-center space-x-3 mt-4">
              {hasDueReviews && state.mode !== 'review' && (
                <TouchableOpacity
                  onPress={handleSwitchToReviewMode}
                  className="flex-row items-center px-3 py-2 bg-blue-500 rounded-full"
                >
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-xs mr-1">
                    {t('training.switch_to_review')}
                  </Text>
                </TouchableOpacity>
              )}

              {state.mode === 'review' && (
                <TouchableOpacity
                  onPress={handleJumpToLatestSaved}
                  className="flex-row items-center px-3 py-2 bg-purple-500 rounded-full"
                >
                  <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-xs mr-1">
                    {t('training.return_to_memorization')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Footer Actions */}
      <View className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {/* Interpolation Recommended for this string */}
            {canContinue 
              ? t('training.words_revealed_count', { count: revealedWords.length }) 
              : t('training.session_end_message')}
          </Text>

          <View className="flex-row space-x-2">
            {hasDueReviews && (
              <View className="flex-row items-center">
                <Ionicons name="time" size={12} color="#F59E0B" />
                <Text className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                  {/* Interpolation Recommended for this string */}
                  {t('training.due_reviews_count', { count: reviewDetector.dueReviews.size })}
                </Text>
              </View>
            )}
            {state.mode === 'training' && (
              <View className="flex-row items-center">
                <Ionicons name="infinite" size={12} color="#10B981" />
                <Text className="text-xs text-green-600 dark:text-green-400 mr-1">
                  {t('training.free_training_badge')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View >
  );
};

export default TrainingSession;