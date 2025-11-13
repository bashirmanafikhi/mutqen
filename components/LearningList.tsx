// src/components/LearningList.tsx

import { useSettings } from '@/context/AppSettingContext';
import { UserLearning } from '@/models/QuranModels';
import { Link } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QuranProgressBar from './QuranProgressBar';

interface LearningListProps {
    learnings: UserLearning[];
    isLoading: boolean;
    onDeleteLearning: (id: number) => void;
}

const LearningList: React.FC<LearningListProps> = ({ learnings, isLoading, onDeleteLearning }) => {
    const { isDark } = useSettings();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-app-bg-light dark:bg-app-bg-dark">
                <ActivityIndicator size="large" color={isDark ? "#818CF8" : "#6366F1"} />
                <Text className="mt-2 text-lg text-app-text-secondary-light dark:text-app-text-secondary-dark">
                    جاري تحميل قائمة المحفوظات...
                </Text>
            </View>
        );
    }

    if (learnings.length === 0) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-app-bg-light dark:bg-app-bg-dark">
                <Text className="text-xl text-app-text-secondary-light dark:text-app-text-secondary-dark text-center">
                    لا يوجد لديك أي محفوظات بعد. اضغط على "+" لإضافة عنصر جديد!
                </Text>
            </View>
        );
    }

    const renderItem = ({ item }: ListRenderItemInfo<UserLearning>) => (
        <View className="flex-col mb-4 mx-3 p-4 rounded-2xl border bg-app-surface-light dark:bg-app-surface-dark border-app-border-light dark:border-app-border-dark shadow-sm dark:shadow-none">

            {/* Header: Title + Date */}
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-bold text-app-text-primary-light dark:text-app-text-primary-dark mb-1">
                        {item.title}
                    </Text>
                    <Text className="text-xs text-app-text-secondary-light dark:text-app-text-secondary-dark">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <QuranProgressBar
                firstWordId={item.first_word_id}
                lastWordId={item.last_word_id}
            />

            {/* Action Buttons */}
            <View className="flex-row justify-between mt-4">
                {[
                    { type: 'read', label: '📖 قراءة', bg: 'bg-app-info-light dark:bg-app-info-dark', link: '/(train)/read/[...learningId]' as const },
                    { type: 'train', label: '💪 تدريب', bg: 'bg-app-primary-light dark:bg-app-primary-dark', link: '/(train)/cards/[...learningId]' as const },
                    // { type: 'cloze', label: '✏️ فراغات', bg: 'bg-app-success-light dark:bg-app-success-dark', link: '/(train)/cloze/[...learningId]' as const },
                        { type: 'progress', label: '📊 التقدّم', bg: 'bg-app-success-light dark:bg-app-success-dark', link: '/(train)/progress/[...learningId]' as const },
                    { type: 'delete', label: '🗑️ حذف', bg: 'bg-app-error-light dark:bg-app-error-dark', action: () => onDeleteLearning(item.id) },
                ].map((btn, idx) => (
                    btn.link ? (
                        <Link
                            key={idx}
                            href={{
                                pathname: btn.link,
                                params: {
                                    learningId: [item.id.toString()],
                                    startWordId: item.first_word_id.toString(),
                                    endWordId: item.last_word_id.toString(),
                                    title: item.title,
                                },
                            }}
                            asChild
                        >
                            <TouchableOpacity
                                className={`flex-1 mx-1 py-2 rounded-xl justify-center items-center ${btn.bg}`}
                            >
                                <Text className="text-white font-semibold text-sm">{btn.label}</Text>
                            </TouchableOpacity>
                        </Link>
                    ) : (
                        <TouchableOpacity
                            key={idx}
                            onPress={btn.action}
                            className={`flex-1 mx-1 py-2 rounded-xl justify-center items-center ${btn.bg}`}
                        >
                            <Text className="text-white font-semibold text-sm">{btn.label}</Text>
                        </TouchableOpacity>
                    )
                ))}
            </View>
        </View>
    );

    return (
        <FlatList
            data={learnings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            className="flex-1 bg-app-bg-light dark:bg-app-bg-dark"
            contentContainerStyle={{ paddingVertical: 10 }}
        />
    );
};

export default LearningList;
