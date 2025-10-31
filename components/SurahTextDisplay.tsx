import { QuranWord } from '@/models/QuranModels';
import React from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, View } from 'react-native';

// ===============================================
// واجهة (Interface) لتمثيل الآية المجمعة
// ===============================================
interface Aya {
    aya_number: number;
    text: string;
}

interface SurahTextProps {
    words: QuranWord[];
    surahName: string;
    isLoading: boolean;
}

/**
 * دالة مساعدة لجمع الكلمات المفردة (QuranWord[]) في نصوص آيات (Aya[])
 */
const groupWordsIntoAyas = (words: QuranWord[]): Aya[] => {
    if (!words || words.length === 0) return [];

    const ayasMap = new Map<number, string>();
    
    words.forEach(word => {
        // نجمع الكلمات ونضيف مسافة بينها
        let currentText = ayasMap.get(word.aya_number) || "";
        currentText += " " + word.text;
        
        // إذا كانت نهاية آية، نضف رقم الآية داخل قوسين (كعلامة)
        if (word.is_end_of_aya) {
            currentText += ` {${word.aya_number}} `; 
        }
        
        ayasMap.set(word.aya_number, currentText.trim());
    });

    // نحول Map إلى مصفوفة لـ FlatList
    const ayas: Aya[] = [];
    ayasMap.forEach((text, aya_number) => ayas.push({ aya_number, text }));

    return ayas;
};

const renderAyaItem = ({ item }: ListRenderItemInfo<Aya>) => (
    <View className="flex-row p-2 border-b border-gray-100 items-start">
        <Text className="text-gray-500 font-bold w-6 text-center mt-1">{item.aya_number}</Text>
        {/* تنسيق الخط العربي هنا مهم جداً لضمان عرض النص القرآني بشكل صحيح */}
        <Text className="flex-1 text-2xl font-quran leading-loose text-right">
            {item.text}
        </Text>
    </View>
);

export default function SurahTextDisplay({ words, surahName, isLoading }: SurahTextProps) {
    
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="mt-2 text-lg text-gray-500">جاري تحميل كلمات سورة {surahName}...</Text>
            </View>
        );
    }
    
    if (words.length === 0 && surahName) {
        return (
            <View className="flex-1 justify-center items-center p-8">
                <Text className="text-xl text-red-500 text-center">
                    لا توجد بيانات (كلمات) لسورة {surahName}. تأكد من ملء جدول QuranWords بالكامل.
                </Text>
            </View>
        );
    }

    const ayas = groupWordsIntoAyas(words);
    
    return (
        <FlatList<Aya>
            data={ayas}
            renderItem={renderAyaItem}
            keyExtractor={(item) => item.aya_number.toString()}
            className="flex-1 p-4"
            ListHeaderComponent={() => (
                <Text className="text-3xl font-bold text-center mb-4 text-blue-800">
                    {surahName}
                </Text>
            )}
        />
    );
}