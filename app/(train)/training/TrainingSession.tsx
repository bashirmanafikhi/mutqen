// src/components/training/TrainingSession.tsx
import ProgressIndicator from '@/components/training/ProgressIndicator';
import RevealedList from '@/components/training/RevealedList';
import ReviewAlert from '@/components/training/ReviewAlert';
import StatsOverview from '@/components/training/StatsOverview';
import TrainingCard from '@/components/training/TrainingCard';
import { useSettings } from '@/context/AppSettingContext';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { WordWithProgress } from '@/services/data/TrainingQueryService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import CompletionScreen from './CompletionScreen';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'training' | 'review'>('training');

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
    jumpToReview,
    continueMemorization,
    switchToReviewMode,
    dismissReviewAlert,
    restartSession,
    
    // Status
    canContinue,
    isFinished,
    hasDueReviews,
    shouldShowReviewAlert
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

  const handleJumpToReview = useCallback(() => {
    const nextReview = reviewDetector.getNextDueReview();
    if (nextReview) {
      jumpToReview(nextReview.word_id);
    }
  }, [jumpToReview, reviewDetector]);

  const handleWordPress = useCallback((word: WordWithProgress) => {
    // Optional: Implement word details view
    console.log('Word pressed:', word);
  }, []);

  const toggleStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);

  if (isInitializing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
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
      {/* Review Alert */}
      <ReviewAlert
        isVisible={shouldShowReviewAlert}
        dueReview={reviewDetector.getNextDueReview()}
        onJumpToReview={handleJumpToReview}
        onDismiss={dismissReviewAlert}
        onContinueAnyway={continueMemorization}
      />

      {/* Header */}
      <View className={`pt-4 px-4 pb-2 border-b ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </Text>
          
          <TouchableOpacity
            onPress={toggleStats}
            className={`p-2 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <Ionicons 
              name={showStats ? "stats-chart" : "stats-chart-outline"} 
              size={20} 
              color={isDark ? "#D1D5DB" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentWordId={currentWord?.id || startWordId}
          startId={startWordId}
          endId={endWordId}
          totalWords={state.words.length}
          completedWords={revealedWords.length}
          mode={state.mode}
        />
      </View>

      {/* Stats Overview */}
      {showStats && (
        <StatsOverview stats={stats} isVisible={showStats} />
      )}

      {/* Tab Navigation */}
      <View className={`flex-row border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <TouchableOpacity
          onPress={() => setActiveTab('training')}
          className={`flex-1 py-3 items-center ${
            activeTab === 'training' 
              ? (isDark ? 'bg-gray-700 border-b-2 border-indigo-500' : 'bg-white border-b-2 border-indigo-500')
              : (isDark ? 'bg-gray-800' : 'bg-gray-100')
          }`}
        >
          <Text className={`font-semibold ${
            activeTab === 'training'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {t('training.current_card')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('review')}
          className={`flex-1 py-3 items-center ${
            activeTab === 'review'
              ? (isDark ? 'bg-gray-700 border-b-2 border-green-500' : 'bg-white border-b-2 border-green-500')
              : (isDark ? 'bg-gray-800' : 'bg-gray-100')
          }`}
        >
          <View className="flex-row items-center">
            <Text className={`font-semibold mr-1 ${
              activeTab === 'review'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {t('training.revealed_words')}
            </Text>
            {revealedWords.length > 0 && (
              <View className={`px-1.5 py-0.5 rounded-full ${
                isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <Text className="text-xs text-gray-700 dark:text-gray-300 font-bold">
                  {revealedWords.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View className="flex-1">
        {activeTab === 'training' ? (
          // Training Card View
          <View className="flex-1 justify-center items-center p-6">
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
              <View className="items-center">
                <Ionicons 
                  name="alert-circle-outline" 
                  size={48} 
                  color={isDark ? "#6B7280" : "#9CA3AF"} 
                />
                <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
                  {t('training.no_more_words')}
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            <View className="flex-row justify-center space-x-4 mt-8">
              {hasDueReviews && state.mode !== 'review' && (
                <TouchableOpacity
                  onPress={switchToReviewMode}
                  className="flex-row items-center px-4 py-2 bg-blue-500 rounded-full"
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text className="text-white font-semibold mr-1">
                    {t('training.switch_to_review')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          // Revealed Words View
          <View style={{ height: SCREEN_HEIGHT * 0.7 }} className="px-4 py-3">
            <RevealedList
              revealedWords={revealedWords}
              onWordPress={handleWordPress}
            />
          </View>
        )}
      </View>

      {/* Footer Actions */}
      <View className={`p-4 border-t ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {canContinue ? `${revealedWords.length} كلمة مكشوفة` : 'نهاية الجلسة'}
          </Text>
          
          <View className="flex-row space-x-2">
            {hasDueReviews && (
              <View className="flex-row items-center">
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                  {reviewDetector.dueReviews.size} مراجعة مستحقة
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default TrainingSession;