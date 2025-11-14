import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

import AddNewLearningModal from "@/components/AddNewLearningModal";
import LearningList from "@/components/LearningList";
import { useSettings } from "@/context/AppSettingContext";
import { QuranDivision, UserLearning } from "@/models/QuranModels";
import { fetchQuranDivision } from "@/services/data/divisionQueries";
import { deleteLearningById, fetchAllLearnings, insertNewLearning } from "@/services/data/learningQueries";

export default function Index() {
    const { t } = useTranslation();
    const { isDark } = useSettings();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [learnings, setLearnings] = useState<UserLearning[]>([]);
    const [quranDivision, setQuranDivision] = useState<QuranDivision | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ===============================
    // 📦 Load Data
    // ===============================
    const loadLearnings = useCallback(async () => {
        try {
            setIsLoading(true);
            const division = await fetchQuranDivision();
            setQuranDivision(division);

            const rawLearnings = await fetchAllLearnings();
            setLearnings(rawLearnings);
        } catch (error) {
            console.error("Failed to load learnings:", error);
            Alert.alert(t('common.error'), t('home.load_error'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadLearnings();
    }, [loadLearnings]);

    // ===============================
    // ➕ Create New Learning
    // ===============================
    const handleCreateLearning = async (title: string, startWordId: number, endWordId: number) => {
        try {
            const newItem = await insertNewLearning(title, startWordId, endWordId);
            setLearnings((prev) => [newItem, ...prev]);
        } catch (error) {
            console.error("Error creating learning:", error);
            Alert.alert(t('common.error'), t('home.create_error'));
        }
    };

    // ===============================
    // ❌ Delete Learning
    // ===============================
    const handleDeleteLearning = async (id: number) => {
        try {
            await deleteLearningById(id);
            setLearnings((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting learning:", error);
            Alert.alert(t('common.error'), t('home.delete_error'));
        }
    };

    // ===============================
    // 🖥️ Render
    // ===============================
    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">

            <Stack.Screen options={{ title: t('home.title') }} />
            
            {/* Body - now only contains the LearningList and the floating button */}
            <View className="flex-1">
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={isDark ? "#f9fafb" : "#4f46e5"} />
                        <Text className="text-gray-400 mt-2">{t('home.loading')}</Text>
                    </View>
                ) : (
                    <LearningList 
                        learnings={learnings} 
                        isLoading={isLoading} 
                        onDeleteLearning={handleDeleteLearning} 
                        quranDivision={quranDivision}
                    />
                )}
            </View>

            {/* Floating Add Button */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-indigo-600 dark:bg-indigo-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
                onPress={() => setIsModalVisible(true)}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Modal */}
            <AddNewLearningModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onCreateLearning={handleCreateLearning}
            />
        </View>
    );
}