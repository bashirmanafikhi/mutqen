// src/components/training/TrainingCard.tsx
import { useSettings } from '@/context/AppSettingContext';
import { CardProps } from '@/models/TrainingModels';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80; // Fixed threshold instead of percentage

const TrainingCard: React.FC<CardProps> = ({ 
  word, 
  isRevealed, 
  onReveal, 
  onSwipe, 
  mode,
  showQuestionMark = true,
  timer = 5 
}) => {
  const { isDark } = useSettings();
  const [localTimer, setLocalTimer] = useState(timer);
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | undefined>(undefined);

  // Reset card position and timer when word changes
  useEffect(() => {
    translateX.setValue(0);
    setLocalTimer(timer);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [word.id, timer, translateX]);

  // Timer countdown
  useEffect(() => {
    if (!isRevealed && localTimer > 0) {
      timerRef.current = setInterval(() => {
        setLocalTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onReveal?.(1); // Auto-reveal with lowest quality when timer ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRevealed, localTimer, onReveal]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === 5) { // END
      const isSwipedRight = translationX > SWIPE_THRESHOLD;
      const isSwipedLeft = translationX < -SWIPE_THRESHOLD;

      if (isSwipedRight || isSwipedLeft) {
        const isCorrect = isSwipedRight;
        
        // Immediate swipe action
        onSwipe?.(word.id, isCorrect);
      } else {
        // Return to original position quickly
        Animated.timing(translateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleRevealPress = () => {
    if (!isRevealed) {
      const quality = Math.max(1, Math.min(5, localTimer));
      onReveal?.(quality);
    }
  };

  const getCardColors = () => {
    if (isRevealed) {
      return {
        bg: isDark ? 'bg-gray-800' : 'bg-white',
        text: isDark ? 'text-gray-100' : 'text-gray-900',
        border: isDark ? 'border-gray-600' : 'border-gray-300'
      };
    }

    if (mode === 'review') {
      return {
        bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
        text: isDark ? 'text-blue-200' : 'text-blue-600',
        border: isDark ? 'border-blue-700' : 'border-blue-200'
      };
    }

    return {
      bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      text: isDark ? 'text-purple-200' : 'text-purple-600',
      border: isDark ? 'border-purple-700' : 'border-purple-200'
    };
  };

  const colors = getCardColors();

  return (
    <View className="w-full items-center">
      {/* Card Container */}
      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
        <Animated.View 
          style={{ 
            transform: [{ translateX }],
          }}
          className={`w-full max-w-sm border-2 rounded-3xl shadow-xl ${colors.bg} ${colors.border}`}
        >
          <TouchableOpacity
            onPress={handleRevealPress}
            className="w-full h-40 justify-center items-center p-6"
            disabled={isRevealed}
            activeOpacity={0.7}
          >
            {/* Card Content */}
            {isRevealed ? (
              // Revealed State
              <View className="w-full items-center">
                <Text className={`text-4xl font-uthmanic text-center mb-2 ${colors.text}`}>
                  {word.text}
                </Text>
                <View className="flex-row items-center justify-center space-x-4">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {word.sura_name} - آية {word.aya_number}
                  </Text>
                  {word.memory_tier !== undefined && word.memory_tier > 0 && (
                    <View className={`px-2 py-1 rounded-full ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <Text className="text-xs text-gray-600 dark:text-gray-300">
                        المستوى {word.memory_tier}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Hidden State
              <View className="w-full items-center justify-between" style={{ height: 120 }}>
                {showQuestionMark ? (
                  <View className="items-center flex-1 justify-center">
                    <Text className="text-6xl text-gray-400 dark:text-gray-500 mb-2">
                      ?
                    </Text>
                    <Text className={`text-lg font-semibold text-center ${colors.text}`}>
                      اضغط للكشف
                    </Text>
                  </View>
                ) : (
                  <View className="flex-1 justify-center">
                    <Text className={`text-4xl font-uthmanic text-center ${colors.text}`}>
                      {word.text}
                    </Text>
                  </View>
                )}
                
                {/* Timer - Properly positioned at bottom */}
                <View className={`flex-row items-center px-3 py-1 rounded-full ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <Ionicons 
                    name="time-outline" 
                    size={14} 
                    color={isDark ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text className="text-sm text-gray-600 dark:text-gray-300 mr-1">
                    {localTimer} ثانية
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      {/* Swipe Instructions - Only show when not revealed */}
      {/* {!isRevealed && (
        <View className="flex-row justify-between w-full max-w-sm mt-4 px-4">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text className="text-xs text-red-500 dark:text-red-400 font-medium mr-1">
              خطأ
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-xs text-green-500 dark:text-green-400 font-medium ml-1">
              صحيح
            </Text>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        </View>
      )} */}

      {/* Mode Badge */}
      <View className={`absolute -top-2 px-3 py-1 rounded-full ${
        mode === 'review' 
          ? 'bg-blue-500' 
          : mode === 'memorization' 
          ? 'bg-purple-500' 
          : 'bg-green-500'
      }`}>
        <Text className="text-xs text-white font-semibold">
          {mode === 'review' ? 'مراجعة' : mode === 'memorization' ? 'حفظ جديد' : 'مختلط'}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(TrainingCard);