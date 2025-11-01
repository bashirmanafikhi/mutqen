// app/index.tsx (Main Screen - Dark Mode Applied)

import AddNewLearningModal from '@/components/AddNewLearningModal';
import LearningList from '@/components/LearningList';
import { useSettings } from '@/context/AppSettingContext'; // 👈 Import useSettings
import { UserLearning } from '@/models/QuranModels';
import { deleteLearningById, fetchAllLearnings, insertNewLearning } from '@/services/data/QuranQueries';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

// ===============================================
// Helper Function
// ===============================================

// ===============================================
// Main Component
// ===============================================
export default function Index() {
    const { isDark } = useSettings(); // 👈 Get dark mode status
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [learnings, setLearnings] = useState<UserLearning[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // --- Data Fetching ---
    const loadLearnings = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawLearnings = await fetchAllLearnings();
            setLearnings(rawLearnings);
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
            const newRawLearning = await insertNewLearning(title, startWordId, endWordId);

            setLearnings(prevLearnings => [newRawLearning, ...prevLearnings]);

            Alert.alert("نجاح", `تم حفظ "${title}" بنجاح!`);

        } catch (error) {
            console.error("Error creating learning item:", error);
            Alert.alert("خطأ", "فشل في حفظ المحفوظ. يرجى المحاولة مرة أخرى.");
        }
    };

    // --- Learning Deletion Handler ---
    const handleDeleteLearning = async (id: number) => {
        try {
            await deleteLearningById(id);
            setLearnings(prevLearnings => prevLearnings.filter(item => item.id !== id));
            Alert.alert("تم الحذف", "تم حذف المحفوظ بنجاح.");

        } catch (error) {
            console.error("Error deleting learning item:", error);
            Alert.alert("خطأ", "فشل في حذف المحفوظ. يرجى المحاولة مرة أخرى.");
        }
    };

    return (
        // 1. Apply dark mode background to the main view
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* 2. Configure the screen options (Header style is set in _layout.tsx) */}
            <Stack.Screen
                options={{
                    title: 'متقن | حفظ القرأن الكريم'
                }}
            />

            {/* Header (This local header is redundant since you have an app header in _layout.tsx, 
                but we'll style it for dark mode if you choose to keep it) */}
            <View className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center bg-indigo-600 dark:bg-gray-800">

                <Text className="text-2xl font-bold text-white">
                    قائمة المحفوظات
                </Text>

                {/* Button to open AddNewLearningModal */}
                <TouchableOpacity
                    className="bg-white dark:bg-gray-700 p-2 rounded-full w-16 h-10 justify-center items-center shadow-lg dark:shadow-none"
                    onPress={() => setIsModalVisible(true)}
                >
                    <Ionicons name={"add"} size={20} color={isDark ?
                        '#f9fafb' :
                        '#4f46e5'} />
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