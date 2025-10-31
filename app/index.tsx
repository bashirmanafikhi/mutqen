// app/index.tsx (Main Screen)

import AddNewLearningModal from '@/components/AddNewLearningModal';
import LearningList from '@/components/LearningList';
import { LearningItemDisplay, UserLearning } from '@/models/QuranModels';
import { deleteLearningById, fetchAllLearnings, insertNewLearning } from '@/services/data/QuranQueries';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

// ===============================================
// Helper Function (In a real app, this should be a service)
// ===============================================

/**
 * Converts a raw UserLearning item into a displayable format.
 * NOTE: This is a placeholder. In a full app, you'd fetch Sura Name/Aya Numbers from DB.
 */
const convertToDisplayItem = (item: UserLearning): LearningItemDisplay => {
    // Placeholder logic for demonstration
    return {
        ...item,
        display_text: `بداية ID: ${item.start_word_id}, نهاية ID: ${item.end_word_id}`,
        sura_name: `سورة رقم ${Math.floor(item.start_word_id / 100)}`, // DEMO derivation
        start_aya: Math.floor(item.start_word_id / 10), // DEMO derivation
        end_aya: Math.floor(item.end_word_id / 10),     // DEMO derivation
    };
};

// ===============================================
// Main Component
// ===============================================
export default function Index() {
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [learnings, setLearnings] = useState<LearningItemDisplay[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // --- Data Fetching ---
    const loadLearnings = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawLearnings = await fetchAllLearnings();
            const displayLearnings = rawLearnings.map(convertToDisplayItem);
            setLearnings(displayLearnings);
        } catch (error) {
            console.error("Failed to load learnings:", error);
            Alert.alert("خطأ في البيانات", "فشل تحميل المحفوظات من قاعدة البيانات.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLearnings();
    }, [loadLearnings]);

    // --- Learning Creation Handler ---
    const handleCreateLearning = async (title: string, startWordId: number, endWordId: number) => {
        try {
            // 1. Save to Database
            const newRawLearning = await insertNewLearning(title, startWordId, endWordId);
            
            // 2. Convert and Update Local State (avoids full refetch)
            const newDisplayItem = convertToDisplayItem(newRawLearning);
            
            // Add the new item to the beginning of the list
            setLearnings(prevLearnings => [newDisplayItem, ...prevLearnings]); 

            Alert.alert("نجاح", `تم حفظ "${title}" بنجاح!`);

        } catch (error) {
            console.error("Error creating learning item:", error);
            Alert.alert("خطأ", "فشل في حفظ المحفوظ. يرجى المحاولة مرة أخرى.");
        }
    };

    // --- Learning Deletion Handler (NEW) ---
    const handleDeleteLearning = async (id: number) => {
        try {
            // 1. Delete from Database
            await deleteLearningById(id);
            
            // 2. Update Local State (filter out the deleted item immediately)
            setLearnings(prevLearnings => prevLearnings.filter(item => item.id !== id)); 

            Alert.alert("تم الحذف", "تم حذف المحفوظ بنجاح.");

        } catch (error) {
            console.error("Error deleting learning item:", error);
            Alert.alert("خطأ", "فشل في حذف المحفوظ. يرجى المحاولة مرة أخرى.");
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center bg-indigo-600">
                
                <Text className="text-2xl font-bold text-white">
                    قائمة المحفوظات
                </Text>
                
                {/* Button to open AddNewLearningModal */}
                <TouchableOpacity
                    className="bg-white p-2 rounded-full w-10 h-10 justify-center items-center shadow-lg"
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text className="text-2xl text-indigo-600 font-bold">إضافة +</Text>
                </TouchableOpacity>
            </View>

            {/* Learning List Display */}
            <LearningList
                learnings={learnings}
                isLoading={isLoading}
                onDeleteLearning={handleDeleteLearning}
            />

            {/* Main Modal Component */}
            <AddNewLearningModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onCreateLearning={handleCreateLearning} 
            />
        </View>
    );
}