import { useSettings } from '@/context/AppSettingContext';
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
    let currentText = ayasMap.get(word.aya_number) || "";
    currentText += " " + word.text;

    if (word.is_end_of_aya) {
      currentText += ` {${word.aya_number}}`;
    }

    ayasMap.set(word.aya_number, currentText.trim());
  });

  const ayas: Aya[] = [];
  ayasMap.forEach((text, aya_number) => ayas.push({ aya_number, text }));

  return ayas;
};

const SurahTextDisplay = ({ words, surahName, isLoading }: SurahTextProps) => {
  const { isDark } = useSettings();
  const ayas = groupWordsIntoAyas(words);

  const renderAyaItem = ({ item }: ListRenderItemInfo<Aya>) => (
    <View className={`flex-row p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} items-start`}>
      <Text className={`w-6 text-center mt-1 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.aya_number}
      </Text>
      <Text className={`flex-1 text-2xl leading-relaxed text-right font-quran ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
        {item.text}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#4F46E5'} />
        <Text className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          جاري تحميل كلمات سورة {surahName}...
        </Text>
      </View>
    );
  }

  if (!words.length) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-xl text-red-500 text-center">
          لا توجد بيانات (كلمات) لسورة {surahName}. تأكد من ملء جدول QuranWords بالكامل.
        </Text>
      </View>
    );
  }

  return (
    <FlatList<Aya>
      data={ayas}
      renderItem={renderAyaItem}
      keyExtractor={(item) => item.aya_number.toString()}
      className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      ListHeaderComponent={() => (
        <Text className={`text-3xl font-bold text-center mb-4 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
          {surahName}
        </Text>
      )}
    />
  );
};

export default SurahTextDisplay;
