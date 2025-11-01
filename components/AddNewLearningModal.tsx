// src/components/AddNewLearningModal.tsx

import { QuranJuz, QuranPage, Surah } from '@/models/QuranModels';
import { fetchWordRangeForPage, fetchWordRangeForSurah } from '@/services/data/QuranQueries';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import SelectJuzModal from './SelectJuzModal';
import SelectPageModal from './SelectPageModal';
import SelectSurahModal from './SelectSurahModal';

// ==============================
interface AddNewLearningModalProps {
    isVisible: boolean;
    onClose: () => void;
    onCreateLearning: (title: string, startWordId: number, endWordId: number) => void;
}

enum ActiveModal {
    None,
    Surah,
    Page,
    Juz
}
// ==============================

export default function AddNewLearningModal({ isVisible, onClose, onCreateLearning }: AddNewLearningModalProps) {
    const [activeModal, setActiveModal] = useState<ActiveModal>(ActiveModal.None);

    const reset = () => {
        setActiveModal(ActiveModal.None);
        onClose();
    };

    // Auto-save after selection
    const finalize = (title: string, start: number, end: number) => {
        onCreateLearning(title, start, end);
        reset();
    };

    const handleSelectSurah = async (surah: Surah) => {
        setActiveModal(ActiveModal.None);
        const range = await fetchWordRangeForSurah(surah.id);
        if (!range) return;
        finalize(surah.name, range.start, range.end);
    };

    const handleSelectPage = async (page: QuranPage) => {
        setActiveModal(ActiveModal.None);
        const range = await fetchWordRangeForPage(page.id);
        if (!range) return;

        const title = `الصفحة ${page.id}`;
        finalize(title, range.start, range.end);
    };

    const handleSelectJuz = (juz: QuranJuz) => {
        finalize(juz.name, juz.first_word_id, juz.last_word_id);
    };

    const OptionButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
        <TouchableOpacity
            className="p-4 bg-indigo-50 dark:bg-gray-800 border border-indigo-200 dark:border-gray-700 rounded-lg mb-3"
            onPress={onPress}
        >
            <Text className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 text-center">{title}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal animationType="slide" transparent visible={isVisible} onRequestClose={reset}>
            <SafeAreaView className="flex-1 bg-black/50 dark:bg-black/60">
                <View className="flex-1 bg-white dark:bg-gray-900 mt-10 rounded-t-xl overflow-hidden">

                    {/* Header */}
                    <View className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-row justify-between items-center">
                        <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">إضافة محفوظ جديد</Text>
                        <TouchableOpacity onPress={reset} className="p-2">
                            <Text className="text-xl font-bold text-red-500">إلغاء</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-4 flex-1">
                        <Text className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">تحديد النطاق:</Text>

                        <OptionButton title="تحديد بالـسورة" onPress={() => setActiveModal(ActiveModal.Surah)} />
                        <OptionButton title="تحديد بالـجزء (Juz)" onPress={() => setActiveModal(ActiveModal.Juz)} />
                        <OptionButton title="تحديد بالـالحزب (Hizb)" onPress={() => Alert.alert('قريباً', 'قريباً')} />
                        <OptionButton title="تحديد بالـصفحة" onPress={() => setActiveModal(ActiveModal.Page)} />
                    </ScrollView>

                    {/* Sub-Modals */}
                    <SelectSurahModal
                        isVisible={activeModal === ActiveModal.Surah}
                        onClose={() => setActiveModal(ActiveModal.None)}
                        onSelectSurah={handleSelectSurah}
                    />

                    <SelectPageModal
                        isVisible={activeModal === ActiveModal.Page}
                        onClose={() => setActiveModal(ActiveModal.None)}
                        onSelectPage={handleSelectPage}
                    />

                    <SelectJuzModal
                        isVisible={activeModal === ActiveModal.Juz}
                        onClose={() => setActiveModal(ActiveModal.None)}
                        onSelectJuz={handleSelectJuz}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}
