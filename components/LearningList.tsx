// src/components/LearningList.tsx (Dark Mode Applied)

import { useSettings } from '@/context/AppSettingContext'; // 👈 Import useSettings
import { UserLearning } from '@/models/QuranModels';
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, ListRenderItemInfo, Text, TouchableOpacity, View } from 'react-native';
import QuranProgressBar from './QuranProgressBar';

// ===============================================
// Interfaces
// ===============================================
interface LearningListProps {
    learnings: UserLearning[];
    isLoading: boolean;
    onDeleteLearning: (id: number) => void;
}

// ===============================================
// Presentational Component
// ===============================================
const LearningList: React.FC<LearningListProps> = ({ learnings, isLoading, onDeleteLearning }) => {
    // 🌟 Get dark mode state 🌟
    const { isDark } = useSettings();

    // --- Loading State ---
    if (isLoading) {
        return (
            // Apply dark mode background to the loading container
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
                {/* Ensure indicator color is visible in both modes */}
                <ActivityIndicator size="large" color={isDark ? "#818cf8" : "#4F46E5"} />
                {/* Apply dark mode text color */}
                <Text className="mt-2 text-lg text-gray-500 dark:text-gray-400">جاري تحميل قائمة المحفوظات...</Text>
            </View>
        );
    }

    // --- Empty State ---
    if (learnings.length === 0) {
        return (
            // Apply dark mode background to the empty container
            <View className="flex-1 justify-center items-center p-8 bg-gray-50 dark:bg-gray-900">
                {/* Apply dark mode text color */}
                <Text className="text-xl text-gray-500 dark:text-gray-400 text-center">
                    لا يوجد لديك أي محفوظات بعد. اضغط على "+" لإضافة عنصر جديد!
                </Text>
            </View>
        );
    }

    // Helper function to show a confirmation alert
    const confirmDelete = (item: UserLearning) => {
        Alert.alert(
            "تأكيد الحذف",
            `هل أنت متأكد من حذف المحفوظ: "${item.title}"؟`,
            [
                { text: "إلغاء", style: "cancel" },
                { text: "حذف", style: "destructive", onPress: () => onDeleteLearning(item.id) },
            ],
            { cancelable: true }
        );
    };

    // --- Render List Item ---
const renderItem = ({ item }: ListRenderItemInfo<UserLearning>) => (
    // 🌟 Apply dark mode to list item background and border 🌟
    <View className="flex-col p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">

        {/* Top Row: Learning Details & Action Buttons */}
        <View className="flex-row justify-between items-center mb-4">
            {/* Learning Details (Main Content) */}
            <View className="flex-1 mr-4">
                {/* Title Text */}
                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{item.title}</Text>

                {/* Sura/Aya Text */}
                <Text className="text-base text-indigo-600 dark:text-indigo-400 mb-1">
                    الآيات: {item.start_word_id} - {item.end_word_id}
                </Text>

                {/* Date Text */}
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 self-start">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center space-x-2">

                <Link
                    className='m-1'
                    href={{
                        pathname: "/(train)/read/[...learningId]",
                        params: {
                            learningId: [item.id.toString()],
                            startWordId: item.start_word_id.toString(),
                            endWordId: item.end_word_id.toString(),
                            title: item.title,
                        }
                    }}
                    asChild
                >
                    <TouchableOpacity
                        className="bg-yellow-500 p-2 rounded-lg w-16 justify-center items-center h-10"
                    >
                        <Text className="text-white font-bold text-sm">قراءة</Text>
                    </TouchableOpacity>
                </Link>

                {/* Train Button */}
                <Link
                    className='m-1'
                    href={{
                        pathname: "/(train)/cards/[...learningId]",
                        params: {
                            learningId: [item.id.toString()],
                            startWordId: item.start_word_id.toString(),
                            endWordId: item.end_word_id.toString(),
                            title: item.title,
                        }
                    }}
                    asChild
                >
                    <TouchableOpacity
                        // Train button background remains indigo for prominence
                        className="bg-indigo-500 p-2 rounded-lg w-16 justify-center items-center h-10"
                    >
                        <Text className="text-white font-bold text-sm">تدريب</Text>
                    </TouchableOpacity>
                </Link>

                <Link
                    className='m-1'
                    href={{
                        pathname: "/(train)/cloze/[...learningId]",
                        params: {
                            learningId: [item.id.toString()],
                            startWordId: item.start_word_id.toString(),
                            endWordId: item.end_word_id.toString(),
                            title: item.title,
                        }
                    }}
                    asChild
                >
                    <TouchableOpacity
                        className="bg-emerald-500 p-2 rounded-lg w-16 justify-center items-center h-10"
                    >
                        <Text className="text-white font-bold text-sm">قراغات</Text>
                    </TouchableOpacity>
                </Link>

                {/* Delete Button */}
                <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    // Delete button background remains red
                    className="m-1 bg-red-500 p-2 rounded-lg w-16 justify-center items-center h-10"
                >
                    <Text className="text-white font-bold text-sm">حذف</Text>
                </TouchableOpacity>

            </View>
        </View>

        <View className="w-full">
            <QuranProgressBar firstWordId={item.start_word_id} lastWordId={item.end_word_id} />
        </View>

    </View>
);

    // --- Main List ---
    return (
        <FlatList
            data={learnings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            className="flex-1" // The FlatList container inherits its background from the parent view
        />
    );
};

export default LearningList;