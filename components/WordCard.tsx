// src/components/WordCard.tsx (with timer logic TODO)

import { WordCard } from '@/models/QuranModels';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

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
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [card.isRevealed, timer]);

    const getCardStyles = () => {
        let backgroundColor = 'bg-white dark:bg-gray-700';
        if (card.progressStatus === 'correct') backgroundColor = 'bg-green-200/50 dark:bg-green-900/70';
        else if (card.progressStatus === 'incorrect') backgroundColor = 'bg-red-200/50 dark:bg-red-900/70';
        return `p-6 h-32 justify-center items-center border border-gray-300 dark:border-gray-600 rounded-lg shadow-md dark:shadow-none ${backgroundColor}`;
    };

    const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
        setTranslateX(event.nativeEvent.translationX);
    };

    const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
        const { translationX, state } = event.nativeEvent;
        if (state === 5) {
            const isSwipedRight = translationX > SWIPE_THRESHOLD;
            const isSwipedLeft = translationX < -SWIPE_THRESHOLD;
            if (isSwipedRight || isSwipedLeft) {
                const isCorrect = isSwipedRight;
                setOpacity(0);
                setTimeout(() => onSwipeAction(card.id, isCorrect), 300);
            } else {
                setTranslateX(0);
            }
        }
    };

    const calculateQuality = () => {
        if (timer >= 4) return 5; // fast reveal
        if (timer >= 2) return 4; // medium
        return 3; // slow reveal but still considered good
    };

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
                <TouchableOpacity onPress={handleRevealPress} className={getCardStyles()} disabled={card.isRevealed}>
                    <Text className={`text-4xl font-arabic font-bold ${card.isRevealed ? 'text-gray-900 dark:text-gray-100' : 'text-indigo-600 dark:text-indigo-400'}`}>{cardContent}</Text>
                    {!card.isRevealed && (
                        <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">{timer}</Text>
                    )}
                </TouchableOpacity>

                {!card.isRevealed && (
                    <View className="flex-row justify-between mt-1">
                        <Text className="text-xs text-red-500 dark:text-red-400 font-medium">⬅️ خطأ (سحب)</Text>
                        <Text className="text-xs text-green-500 dark:text-green-400 font-medium">صحيح (سحب) ➡️</Text>
                    </View>
                )}
            </View>
        </PanGestureHandler>
    );
};

export default WordCardComponent;
