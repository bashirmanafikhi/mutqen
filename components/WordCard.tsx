// src/components/WordCard.tsx (UPDATED WITH DARK MODE)

import { WordCard } from '@/models/QuranModels';
import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

interface WordCardProps {
    card: WordCard;
    onReveal: (id: number) => void;
    onSwipeAction: (id: number, isCorrect: boolean) => void;
}

const WordCardComponent: React.FC<WordCardProps> = ({ card, onReveal, onSwipeAction }) => {
    
    // State to handle the card's position for the simple swipe effect
    const [translateX, setTranslateX] = useState(0);
    const [opacity, setOpacity] = useState(1);

    // Determines the background color based on the card's status, now with dark mode classes
    const getCardStyles = () => {
        let backgroundColor = 'bg-white dark:bg-gray-700';
        
        if (card.progressStatus === 'correct') {
            // Light: light green/50 | Dark: dark green/700
            backgroundColor = 'bg-green-200/50 dark:bg-green-900/70'; 
        } else if (card.progressStatus === 'incorrect') {
            // Light: light red/50 | Dark: dark red/700
            backgroundColor = 'bg-red-200/50 dark:bg-red-900/70'; 
        }

        // Added dark:border-gray-600 and dark:shadow-lg
        return `p-6 h-32 justify-center items-center border border-gray-300 dark:border-gray-600 rounded-lg shadow-md dark:shadow-none ${backgroundColor}`;
    };

    // --- Gesture Handler for Swipe ---
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
                
                // 1. Start Fade Out
                setOpacity(0); 

                // 2. Trigger action
                setTimeout(() => {
                    onSwipeAction(card.id, isCorrect);
                }, 300); 

            } else {
                // Snap back if not swiped far enough
                setTranslateX(0);
            }
        }
    };
    
    // Determine the main text content
    const cardContent = card.isRevealed ? card.text : 'اضغط للكشف';

    return (
        <PanGestureHandler 
            onGestureEvent={onGestureEvent} 
            onHandlerStateChange={onHandlerStateChange}
        >
            <View 
                style={{ 
                    transform: [{ translateX: translateX }],
                    opacity: opacity,
                }}
                className="p-2"
            >
                <TouchableOpacity 
                    onPress={() => card.isRevealed ? null : onReveal(card.id)} 
                    className={getCardStyles()}
                    disabled={card.isRevealed}
                >
                    <Text 
                        // Updated text colors for dark mode
                        className={`text-4xl font-arabic font-bold ${
                            card.isRevealed 
                                ? 'text-gray-900 dark:text-gray-100' // Revealed text color
                                : 'text-indigo-600 dark:text-indigo-400' // Hidden text color (CTA)
                        }`}
                    >
                        {cardContent}
                    </Text>
                </TouchableOpacity>
                
                {/* Swipe hints */}
                {!card.isRevealed && (
                    <View className="flex-row justify-between mt-1">
                        {/* Hint text colors for dark mode */}
                        <Text className="text-xs text-red-500 dark:text-red-400 font-medium">⬅️ خطأ (سحب)</Text>
                        <Text className="text-xs text-green-500 dark:text-green-400 font-medium">صحيح (سحب) ➡️</Text>
                    </View>
                )}
                
            </View>
        </PanGestureHandler>
    );
};

export default WordCardComponent;