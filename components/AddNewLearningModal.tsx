// src/components/AddNewLearningModal.tsx

import { QuranJuz, QuranPage, Surah } from '@/models/QuranModels';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SelectJuzModal from './SelectJuzModal';
import SelectPageModal from './SelectPageModal';
import SelectSurahModal from './SelectSurahModal';

// ===============================================
// Interfaces
// ===============================================
interface AddNewLearningModalProps {
    isVisible: boolean;
    onClose: () => void;
    // Function to handle the final learning object creation and pass it up
    onCreateLearning: (title: string, startWordId: number, endWordId: number) => void;
}

// State enum to manage which sub-modal is open
enum ActiveModal {
    None,
    Surah,
    Page,
    Juz
    // Add Juz, Hizb later
}

// ===============================================
// Component
// ===============================================
export default function AddNewLearningModal({ isVisible, onClose, onCreateLearning }: AddNewLearningModalProps) {
    const [activeModal, setActiveModal] = useState<ActiveModal>(ActiveModal.None);
    const [title, setTitle] = useState<string>('');
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [selectedPage, setSelectedPage] = useState<QuranPage | null>(null);
    const [selectedJuz, setSelectedJuz] = useState<QuranJuz | null>(null);

    // For demonstration, we'll manually set dummy word IDs based on selections
    // In a real app, you would need dedicated screens to select start/end word/aya.
    const [startWordId, setStartWordId] = useState<number>(0);
    const [endWordId, setEndWordId] = useState<number>(0);


    // Reset state when the modal closes
    const handleClose = () => {
        setTitle('');
        setSelectedSurah(null);
        setSelectedPage(null);
        setSelectedJuz(null);
        setStartWordId(0);
        setEndWordId(0);
        onClose();
    }

    const handleSelectJuz = (juz: QuranJuz) => { // <-- New Juz handler
        setSelectedJuz(juz);
        // Set word IDs directly from the Juz object
        setStartWordId(juz.first_word_id); 
        setEndWordId(juz.last_word_id);
        setSelectedSurah(null); // Clear other modes for clarity
        setSelectedPage(null);
        setActiveModal(ActiveModal.None);
    }

    const handleCreate = () => {
        if (!title.trim()) {
            Alert.alert("خطأ", "الرجاء إدخال عنوان للمحفوظ.");
            return;
        }
        if (startWordId === 0 || endWordId === 0) {
            Alert.alert("خطأ", "يجب تحديد نطاق الحفظ (بداية ونهاية).");
            return;
        }
        
        // Pass data to the parent component for DB insertion
        onCreateLearning(title.trim(), startWordId, endWordId);
        handleClose();
    }

    // --- Select Handlers ---
    const handleSelectSurah = (surah: Surah) => {
        setSelectedSurah(surah);
        // DEMO: Set dummy start/end words based on surah properties
        setStartWordId(surah.id * 100); 
        setEndWordId(surah.id * 100 + 50);
        setActiveModal(ActiveModal.None);
    }
    
    const handleSelectPage = (page: QuranPage) => {
        setSelectedPage(page);
        // DEMO: Set dummy start/end words based on page properties
        setStartWordId(page.id * 1000); 
        setEndWordId(page.id * 1000 + 200);
        setActiveModal(ActiveModal.None);
    }

    // Function to render the option buttons
    const OptionButton = ({ title, onPress }: { title: string, onPress: () => void }) => (
        <TouchableOpacity 
            className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-3 active:bg-indigo-100"
            onPress={onPress}
        >
            <Text className="text-lg font-semibold text-indigo-700 text-center">{title}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <SafeAreaView className="flex-1 bg-black/50">
                <View className="flex-1 bg-white mt-10 rounded-t-xl overflow-hidden">
                    
                    {/* Header */}
                    <View className="p-4 border-b border-gray-200 bg-gray-50 flex-row justify-between items-center">
                        <Text className="text-2xl font-bold">إضافة محفوظ جديد</Text>
                        <TouchableOpacity onPress={handleClose} className="p-2">
                            <Text className="text-xl font-bold text-red-500">إلغاء</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-4 flex-1">
                        <Text className="text-lg font-semibold mb-2 text-gray-700">عنوان المحفوظ:</Text>
                        <TextInput
                            className="p-3 border border-gray-300 rounded-lg mb-6 text-lg text-right"
                            placeholder="مثل: سورة الكهف، الوجه الأول"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text className="text-xl font-bold mb-4 text-indigo-700">تحديد النطاق:</Text>

                        {/* Selection Options */}
                        <OptionButton title="تحديد بالـسورة" onPress={() => setActiveModal(ActiveModal.Surah)} />
                        <OptionButton title="تحديد بالـجزء (Juz)" onPress={() => setActiveModal(ActiveModal.Juz)} />
                        <OptionButton title="تحديد بالـحزب (Hizb)" onPress={() => Alert.alert('قريباً', 'ميزة تحديد الحزب قريباً!')} />
                        <OptionButton title="تحديد بالـصفحة" onPress={() => setActiveModal(ActiveModal.Page)} />
                        
                        {/* Current Selection Status */}
                        <View className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <Text className="text-base font-bold text-green-700 mb-1">الحالة الحالية:</Text>
                            <Text className="text-base text-gray-800">
                                الجزء: {selectedJuz ? selectedJuz.name : 'لم يتم التحديد'}
                            </Text>
                            <Text className="text-base text-gray-800">
                                السورة: {selectedSurah ? selectedSurah.name : 'لم يتم التحديد'}
                            </Text>
                            <Text className="text-base text-gray-800">
                                الصفحة: {selectedPage ? selectedPage.id : 'لم يتم التحديد'}
                            </Text>
                            <Text className="text-base text-gray-800">
                                بداية Word ID: {startWordId}
                            </Text>
                            <Text className="text-base text-gray-800">
                                نهاية Word ID: {endWordId}
                            </Text>
                        </View>
                        
                        {/* Final Save Button */}
                        <TouchableOpacity
                            className={`p-4 rounded-lg mt-8 ${
                                (startWordId !== 0 && endWordId !== 0 && title.trim()) ? 'bg-indigo-600' : 'bg-gray-400'
                            }`}
                            onPress={handleCreate}
                            disabled={startWordId === 0 || endWordId === 0 || !title.trim()}
                        >
                            <Text className="text-xl font-bold text-white text-center">حفظ المحفوظ</Text>
                        </TouchableOpacity>

                    </ScrollView>

                    {/* Sub-Modals (Rendered conditionally) */}
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