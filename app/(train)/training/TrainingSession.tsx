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
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import CompletionScreen from './CompletionScreen';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Add this component inside TrainingSession.tsx, before the main component
interface RecentWordsPreviewProps {
  words: WordWithProgress[];
  onWordPress: (word: WordWithProgress) => void;
}

const RecentWordsPreview: React.FC<RecentWordsPreviewProps> = ({ words, onWordPress }) => {
  const { isDark } = useSettings();
  const memoryLabels = ['لم تتعلم', 'ضعيف', 'متوسط', 'جيد', 'ممتاز'];

  return (
    <View className="space-y-2">
      {words.map((word, index) => {
        const hasProgress = word.memory_tier !== undefined && word.memory_tier > 0;

        return (
          <TouchableOpacity
            key={`preview-${word.id}`}
            onPress={() => onWordPress(word)}
            className={`flex-row items-center justify-between p-3 rounded-xl border ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            {/* Word Text - Centered */}
            <View className="flex-1 items-center">
              <Text className="text-xl font-uthmanic text-center text-gray-900 dark:text-gray-100">
                {word.text}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {word.sura_name} - آية {word.aya_number}
              </Text>
            </View>

            {/* Memory Tier Badge - Smaller */}
            {hasProgress && (
              <View className={`ml-2 px-1.5 py-0.5 rounded-full ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Text className="text-[10px] text-gray-600 dark:text-gray-300">
                  {memoryLabels[word.memory_tier!]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

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
  const [showRevealedList, setShowRevealedList] = useState(false);
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
    jumpToReview,
    continueMemorization,
    switchToReviewMode,
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

  // Update the switchToReviewMode function
  const handleSwitchToReviewMode = useCallback(() => {
    setModeTransition({
      isTransitioning: true,
      fromMode: state.mode,
      toMode: 'review'
    });

    // Show transition for 500ms then switch mode
    setTimeout(() => {
      switchToReviewMode();
      setModeTransition({ isTransitioning: false });
    }, 500);
  }, [state.mode, switchToReviewMode]);

  // Update the handleJumpToReview function
  const handleJumpToReview = useCallback(() => {
    const nextReview = reviewDetector.getNextDueReview?.();
    if (nextReview) {
      setModeTransition({
        isTransitioning: true,
        fromMode: state.mode,
        toMode: 'review'
      });

      // Show transition then jump
      setTimeout(() => {
        jumpToReview(nextReview.word_id);
        setModeTransition({ isTransitioning: false });
      }, 500);
    }
  }, [jumpToReview, reviewDetector, state.mode]);

  const handleWordPress = useCallback((word: WordWithProgress) => {
    // Optional: Implement word details view
    console.log('Word pressed:', word);
  }, []);

  const toggleRevealedList = useCallback(() => {
    setShowRevealedList(prev => !prev);
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
            تدريب حر
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center px-8">
            جميع الكلمات في هذا النطاق مكتملة. جاري تحميل الكلمات للتدريب الحر...
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
      <View className={`pt-4 px-4 pb-2 border-b ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </Text>

          <View className="flex-row space-x-2">
            {/* Revealed Words Toggle Button */}
            <TouchableOpacity
              onPress={toggleRevealedList}
              className={`p-2 rounded-full ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={showRevealedList ? "list" : "list-outline"}
                  size={20}
                  color={isDark ? "#D1D5DB" : "#6B7280"}
                />
                {revealedWords.length > 0 && (
                  <View className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full ${
                    isDark ? 'bg-green-500' : 'bg-green-400'
                  }`}>
                    <Text className="text-xs text-white font-bold">
                      {revealedWords.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
          <View className={`p-6 rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } items-center`}>
            <Ionicons
              name="refresh"
              size={48}
              color={isDark ? "#818CF8" : "#6366F1"}
            />
            <Text className={`text-lg font-bold mt-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              الانتقال إلى وضع المراجعة
            </Text>
            <Text className={`text-sm mt-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              جاري تحميل كلمات المراجعة...
            </Text>
          </View>
        </View>
      )}

      {/* Mode Indicator Banner */}
      {!modeTransition.isTransitioning && state.mode === 'review' && (
        <View className={`py-2 px-4 border-b ${
          isDark ? 'bg-blue-900 border-blue-700' : 'bg-blue-100 border-blue-200'
        }`}>
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="refresh-circle"
              size={20}
              color={isDark ? "#93C5FD" : "#1D4ED8"}
            />
            <Text className={`font-semibold mr-2 ${
              isDark ? 'text-blue-200' : 'text-blue-800'
            }`}>
              وضع المراجعة - {reviewDetector.dueReviews.size} كلمة مستحقة
            </Text>
          </View>
        </View>
      )}

      {/* Free Training Banner */}
      {!modeTransition.isTransitioning && state.mode === 'training' && (
        <View className={`py-2 px-4 border-b ${
          isDark ? 'bg-green-900 border-green-700' : 'bg-green-100 border-green-200'
        }`}>
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="school"
              size={20}
              color={isDark ? "#86EFAC" : "#16A34A"}
            />
            <Text className={`font-semibold mr-2 ${
              isDark ? 'text-green-200' : 'text-green-800'
            }`}>
              تدريب حر - جميع الكلمات مكشوفة، جاري إعادة التدريب
            </Text>
          </View>
        </View>
      )}

      {/* Main Content Area - Fixed layout to prevent overlapping */}
      <View className="flex-1">
        {showRevealedList ? (
          // Revealed Words View - Full Screen with Training Card at bottom
          <View className="flex-1">
            {/* Revealed List Section - Takes most space */}
            <View className="flex-1">
              <View className={`flex-row justify-between items-center px-4 py-3 border-b ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <Text className={`text-lg font-semibold ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  الكلمات المكشوفة ({revealedWords.length})
                </Text>
                <TouchableOpacity
                  onPress={toggleRevealedList}
                  className="p-2"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? "#D1D5DB" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
              <View className="flex-1 px-4 py-3">
                <RevealedList
                  revealedWords={revealedWords}
                  onWordPress={handleWordPress}
                />
              </View>
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

                {/* Quick Actions - Reduced margin */}
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

                  {/* Show/Hide Revealed Words Button */}
                  <TouchableOpacity
                    onPress={toggleRevealedList}
                    className="flex-row items-center px-3 py-2 bg-gray-500 rounded-full"
                  >
                    <Ionicons 
                      name={showRevealedList ? "eye-off" : "eye"} 
                      size={14} 
                      color="#FFFFFF" 
                    />
                    <Text className="text-white font-semibold text-xs mr-1">
                      {showRevealedList ? 'إخفاء القائمة' : 'إظهار القائمة'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Training Card View with Recent Words Preview
          <View className="flex-1">
            {/* Recent Revealed Words Preview - Only show if there are revealed words */}
            {revealedWords.length > 0 && (
              <View className={`mx-4 mt-4 rounded-xl border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <Text className={`font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    آخر الكلمات المكشوفة
                  </Text>
                  <TouchableOpacity
                    onPress={toggleRevealedList}
                    className="flex-row items-center"
                  >
                    <Text className={`text-sm mr-1 ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`}>
                      عرض الكل
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isDark ? "#818CF8" : "#4F46E5"}
                    />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <RecentWordsPreview
                    words={revealedWords.slice(-3)}
                    onWordPress={handleWordPress}
                  />
                </View>
              </View>
            )}

            {/* Training Card Section - Fixed at bottom with proper spacing */}
            <View className="flex-1 justify-end pb-6">
              <View className="px-6">
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

                {/* Quick Actions - Reduced margin and smaller buttons */}
                <View className="flex-row justify-center space-x-2 mt-4">
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

                  {/* Show Revealed Words Button */}
                  {revealedWords.length > 0 && (
                    <TouchableOpacity
                      onPress={toggleRevealedList}
                      className="flex-row items-center px-3 py-2 bg-green-500 rounded-full"
                    >
                      <Ionicons name="list" size={14} color="#FFFFFF" />
                      <Text className="text-white font-semibold text-xs mr-1">
                        عرض الكلمات ({revealedWords.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Footer Actions */}
      <View className={`p-3 border-t ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {canContinue ? `${revealedWords.length} كلمة مكشوفة` : 'نهاية الجلسة'}
          </Text>

          <View className="flex-row space-x-2">
            {hasDueReviews && (
              <View className="flex-row items-center">
                <Ionicons name="time" size={12} color="#F59E0B" />
                <Text className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                  {reviewDetector.dueReviews.size} مراجعة مستحقة
                </Text>
              </View>
            )}
            {state.mode === 'training' && (
              <View className="flex-row items-center">
                <Ionicons name="infinite" size={12} color="#10B981" />
                <Text className="text-xs text-green-600 dark:text-green-400 mr-1">
                  تدريب حر
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