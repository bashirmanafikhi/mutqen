// components/training/RevealedList.tsx
import { WordCard } from '@/models/QuranModels';
import { toArabicNumber } from '@/services/Utilities';
import React, { forwardRef } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    revealedWords: WordCard[];
    updateProgress: (wordId: number, quality: number, status: 'correct' | 'incorrect') => void;
}

const RevealedList = forwardRef<FlatList<WordCard>, Props>(({ revealedWords, updateProgress }, ref) => {
    const renderItem = ({ item }: { item: WordCard }) => {
        const isLast = revealedWords[revealedWords.length - 1]?.id === item.id;
        return (
            <View>
                <View
                    className="flex-row items-center justify-between m-4 p-4 rounded-lg dark:bg-gray-800"
                    style={{ backgroundColor: item.progressStatus === 'correct' ? '#D1FAE5' : '#FEE2E2' }}
                >
                    <TouchableOpacity onPress={() => updateProgress(item.id, item.progressStatus === 'correct' ? 1 : 5, item.progressStatus === 'correct' ? 'incorrect' : 'correct')} className="p-2 rounded-md border">
                        <Text>تغيير</Text>
                    </TouchableOpacity>
                    <Text className="p-2 text-4xl font-uthmanic">{item.text}</Text>
                    <View><Text className="text-lg"> </Text></View>
                </View>
                {!isLast && item.is_end_of_aya ? (
                    <Text className="text-4xl font-uthmanic text-center text-white">{toArabicNumber(item.aya_number)}</Text>
                ) : null}
            </View>
        );
    };

    return (
        <FlatList
            inverted
            contentContainerStyle={{ flexDirection: 'column-reverse' }}
            ref={ref}
            data={revealedWords}
            renderItem={renderItem}
            keyExtractor={item => `revealed-${item.id}`}
        //ListHeaderComponent={<Text className="text-center text-xl font-bold p-3 border-b border-gray-200 dark:border-gray-700 dark:text-white">الكلمات المكتشفة</Text>}
        />
    );
});

export default RevealedList;
