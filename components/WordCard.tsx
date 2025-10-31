// src/components/WordCard.tsx (NEW SIMPLIFIED VERSION)

import { WordCard } from '@/models/QuranModels';
import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface WordCardProps {
    card: WordCard;
    onReveal: (id: number) => void;
    onSwipeAction: (id: number, isCorrect: boolean) => void;
}

const WordCardComponent: React.FC<WordCardProps> = ({ card, onReveal, onSwipeAction }) => {
    
    // State to handle the card's position for the simple swipe effect
    const [translateX, setTranslateX] = useState(0);
    const [opacity, setOpacity] = useState(1);

    // Determines the background color based on the card's status
    const getCardStyles = () => {
        let backgroundColor = 'bg-white';
        if (card.progressStatus === 'correct') {
            backgroundColor = 'bg-green-200/50';
        } else if (card.progressStatus === 'incorrect') {
            backgroundColor = 'bg-red-200/50';
        }
        return `p-6 h-32 justify-center items-center border border-gray-300 rounded-lg shadow-md ${backgroundColor}`;
    };

    // --- Gesture Handler for Swipe ---
    const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
        // Simple drag feedback (visual position update)
        setTranslateX(event.nativeEvent.translationX);
    };

    const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
        const { translationX, state } = event.nativeEvent;
        
        // Use state == 5 (Gesture.END) for final action
        if (state === 5) { 
            const isSwipedRight = translationX > SWIPE_THRESHOLD;
            const isSwipedLeft = translationX < -SWIPE_THRESHOLD;

            if (isSwipedRight || isSwipedLeft) {
                // Determine action (Right = Correct, Left = Incorrect)
                const isCorrect = isSwipedRight;
                
                // 1. Start Fade Out (Simple animation by changing opacity)
                setOpacity(0); 

                // 2. Trigger action after a small delay to allow the fade to start
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
        <GestureHandlerRootView>
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
                        <Text className={`text-4xl font-arabic font-bold ${card.isRevealed ? 'text-gray-900' : 'text-indigo-600'}`}>
                            {cardContent}
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Swipe hints */}
                    {!card.isRevealed && (
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-xs text-red-500 font-medium">⬅️ خطأ (سحب)</Text>
                            <Text className="text-xs text-green-500 font-medium">صحيح (سحب) ➡️</Text>
                        </View>
                    )}
                    
                </View>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
};

export default WordCardComponent;