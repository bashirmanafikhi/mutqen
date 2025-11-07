import { WordCard } from '@/models/QuranModels';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.1; // 10% screen width

interface WordCardProps {
  card: WordCard;
  onReveal: (id: number, quality: number) => void;
  onSwipeAction: (id: number, isCorrect: boolean) => void;
}

const WordCardComponent: React.FC<WordCardProps> = ({ card, onReveal, onSwipeAction }) => {
  const [translateX, setTranslateX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    if (!card.isRevealed && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [card.isRevealed, timer]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    setTranslateX(event.nativeEvent.translationX);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, state } = event.nativeEvent;
    if (state === 5) { // END
      const isSwipedRight = translationX > SWIPE_THRESHOLD;
      const isSwipedLeft = translationX < -SWIPE_THRESHOLD;

      if (isSwipedRight || isSwipedLeft) {
        const isCorrect = isSwipedRight;
        setOpacity(0);
        setTimeout(() => onSwipeAction(card.id, isCorrect), 50);
      } else {
        setTranslateX(0);
      }
    }
  };

  const calculateQuality = () => timer;

  const handleRevealPress = () => {
    if (!card.isRevealed) {
      const quality = calculateQuality();
      onReveal(card.id, quality);
    }
  };

  const cardContent = card.isRevealed ? card.text : 'اضغط للكشف';

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <View style={{ transform: [{ translateX }], opacity }} className="p-2">
        
        {/* Card */}
        <TouchableOpacity
          onPress={handleRevealPress}
          className="p-6 h-32 justify-center items-center border border-gray-300 dark:border-gray-600 rounded-2xl shadow-md dark:shadow-none bg-white dark:bg-gray-800"
          disabled={card.isRevealed}
        >
          <Text className={`text-4xl font-bold text-center ${card.isRevealed ? 'text-gray-900 dark:text-gray-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {cardContent}
          </Text>

          {!card.isRevealed ? (
            <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">{timer}</Text>
          ): null}
        </TouchableOpacity>

        {/* Swipe Instructions */}
        {!card.isRevealed ? (
          <View className="flex-row justify-between mt-2 px-2">
            <Text className="text-xs text-red-500 dark:text-red-400 font-medium">⬅️ خطأ (سحب)</Text>
            <Text className="text-xs text-green-500 dark:text-green-400 font-medium">صحيح (سحب) ➡️</Text>
          </View>
        ) : null}
      </View>
    </PanGestureHandler>
  );
};

export default WordCardComponent;
