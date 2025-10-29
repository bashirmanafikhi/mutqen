import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import SurahModal from '../components/SurahModal';
import SurahTextDisplay from '../components/SurahTextDisplay';
import { fetchWordsBySurahId, QuranWord } from '../services/DatabaseService';

// تعريف نوع لتمثيل السورة المختارة (لتسهيل استخدامها في متغير الحالة)
interface SelectedSurah {
    id: number;
    name: string;
}

export default function Index() {
// حالة الـ Modal
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    
    // حالة السورة المختارة
    const [selectedSurah, setSelectedSurah] = useState<SelectedSurah | null>(null);
    
    // حالة كلمات السورة
    const [surahWords, setSurahWords] = useState<QuranWord[]>([]);
    
    // حالة التحميل أثناء جلب الكلمات
    const [isWordsLoading, setIsWordsLoading] = useState<boolean>(false);

    /**
     * الدالة التي يتم استدعاؤها عند اختيار سورة من الـ Modal
     */
    const handleSelectSurah = async (id: number, name: string) => {
        setSelectedSurah({ id, name });
        setIsWordsLoading(true);
        setSurahWords([]); // مسح الكلمات القديمة

        try {
            // 💡 استخدام الدالة الجديدة لجلب الكلمات
            const words = await fetchWordsBySurahId(id);
            setSurahWords(words);
            
        } catch (error) {
            console.error(`فشل جلب كلمات سورة ${name}:`, error);
            // قد ترغب في عرض رسالة خطأ للمستخدم هنا
        } finally {
            setIsWordsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center bg-indigo-600">
                
                <Text className="text-xl font-bold text-white">
                    {selectedSurah ? selectedSurah.name : 'اختر سورة'}
                </Text>
                
                {/* زر فتح الـ Modal */}
                <TouchableOpacity
                    className="bg-white p-2 rounded-lg"
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text className="text-indigo-600 font-bold">تغيير السورة</Text>
                </TouchableOpacity>
            </View>

            {/* عرض نص السورة */}
            <View className="flex-1">
                {selectedSurah ? (
                    <SurahTextDisplay
                        words={surahWords}
                        surahName={selectedSurah.name}
                        isLoading={isWordsLoading}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-lg text-gray-500">
                            من فضلك، استخدم زر "تغيير السورة" للبدء.
                        </Text>
                    </View>
                )}
            </View>

            {/* الـ Modal */}
            <SurahModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectSurah={handleSelectSurah} // تمرير دالة معالجة الاختيار
            />
        </SafeAreaView>
    );
}
