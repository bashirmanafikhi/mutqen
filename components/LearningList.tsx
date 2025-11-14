import { useSettings } from '@/context/AppSettingContext';
import { QuranDivision, UserLearning } from '@/models/QuranModels';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
    quranDivision?: QuranDivision | null;
}

const LearningList: React.FC<LearningListProps> = ({
    learnings,
    isLoading,
    onDeleteLearning,
    quranDivision
}) => {
    const { isDark } = useSettings();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-app-bg-light dark:bg-app-bg-dark">
                <ActivityIndicator size="large" color={isDark ? "#818CF8" : "#6366F1"} />
                <Text className="mt-2 text-lg text-app-text-secondary-light dark:text-app-text-secondary-dark">
                    {t('learningList.loading_list')}
                </Text>
            </View>
        );
    }

    // ===============================
    // 🖥️ Render List Header Component (Scrollable Header)
    // ===============================
    const renderListHeader = () => (
        <View className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">

            {/* Quran Division Card */}
            {quranDivision && (
                <View className="flex-col p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                    {/* Title */}
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {/* Placeholder for any extra status */}
                        </Text>
                        <View className="flex-row items-center">
                            <Ionicons
                                name="book"
                                size={16}
                                color={isDark ? "#818CF8" : "#6366F1"}
                                style={{ marginRight: 6 }}
                            />
                            <Text className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                                {t('learningList.all_quran')}
                            </Text>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {/* Placeholder for any extra status */}
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <QuranProgressBar
                        firstWordId={quranDivision.first_word_id}
                        lastWordId={quranDivision.last_word_id}
                    />

                    {/* Action Buttons for Quran Division */}
                    <View className="flex-row justify-between mt-4">
                        {[
                            {
                                type: 'read',
                                label: t('actions.read'),
                                bg: 'bg-app-info-light dark:bg-app-info-dark',
                                link: '/(train)/read/[...learningId]' as const,
                                icon: 'book-outline' as const
                            },
                            {
                                type: 'train',
                                label: t('actions.train'),
                                bg: 'bg-app-primary-light dark:bg-app-primary-dark',
                                link: '/(train)/cards/[...learningId]' as const,
                                icon: 'school-outline' as const
                            },
                            // { 
                            //     type: 'progress', 
                            //     label: t('actions.progress'), 
                            //     bg: 'bg-app-success-light dark:bg-app-success-dark', 
                            //     link: '/(train)/progress/[...learningId]' as const,
                            //     icon: 'stats-chart-outline' as const
                            // },
                        ].map((btn, idx) => (
                            <Link
                                key={idx}
                                href={{
                                    pathname: btn.link,
                                    params: {
                                        // هنا نستخدم ID القسم القرآني العام
                                        learningId: [quranDivision.id.toString()],
                                        startWordId: quranDivision.first_word_id.toString(),
                                        endWordId: quranDivision.last_word_id.toString(),
                                        title: quranDivision.name,
                                    },
                                }}
                                asChild
                            >
                                <TouchableOpacity
                                    className={`flex-1 mx-1 py-2 rounded-xl justify-center items-center ${btn.bg}`}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name={btn.icon}
                                            size={16}
                                            color="#FFFFFF"
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text className="text-white font-semibold text-sm">{btn.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>

                </View>
            )}
        </View>
    );

    const renderItem = ({ item }: ListRenderItemInfo<UserLearning>) => (
        <View className="flex-col mb-4 mx-3 p-4 rounded-2xl border bg-app-surface-light dark:bg-app-surface-dark border-app-border-light dark:border-app-border-dark shadow-sm dark:shadow-none">

            {/* Header: Title + Date */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                        <Ionicons
                            name="document-text-outline"
                            size={16}
                            color={isDark ? "#D1D5DB" : "#6B7280"}
                            style={{ marginRight: 6 }}
                        />
                        <Text className="text-lg font-bold text-app-text-primary-light dark:text-app-text-primary-dark">
                            {item.title}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons
                            name="calendar-outline"
                            size={12}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                            style={{ marginRight: 4 }}
                        />
                        <Text className="text-xs text-app-text-secondary-light dark:text-app-text-secondary-dark">
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center">
                    <Ionicons
                        name="star"
                        size={12}
                        color={isDark ? "#FBBF24" : "#F59E0B"}
                        style={{ marginRight: 4 }}
                    />
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                        حفظ جديد
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
                    {
                        type: 'read',
                        label: t('actions.read'),
                        bg: 'bg-app-info-light dark:bg-app-info-dark',
                        link: '/(train)/read/[...learningId]' as const,
                        icon: 'book-outline' as const
                    },
                    {
                        type: 'train',
                        label: t('actions.train'),
                        bg: 'bg-app-primary-light dark:bg-app-primary-dark',
                        link: '/(train)/training/[...learningId]' as const,
                        icon: 'school-outline' as const
                    },
                    {
                        type: 'progress',
                        label: t('actions.progress'),
                        bg: 'bg-app-success-light dark:bg-app-success-dark',
                        link: '/(train)/progress/[...learningId]' as const,
                        icon: 'stats-chart-outline' as const
                    },
                    {
                        type: 'delete',
                        label: t('actions.delete'),
                        bg: 'bg-app-error-light dark:bg-app-error-dark',
                        action: () => onDeleteLearning(item.id),
                        icon: 'trash-outline' as const
                    },
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
                                <View className="flex-row items-center">
                                    <Ionicons
                                        name={btn.icon}
                                        size={16}
                                        color="#FFFFFF"
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text className="text-white font-semibold text-sm">{btn.label}</Text>
                                </View>
                            </TouchableOpacity>
                        </Link>
                    ) : (
                        <TouchableOpacity
                            key={idx}
                            onPress={btn.action}
                            className={`flex-1 mx-1 py-2 rounded-xl justify-center items-center ${btn.bg}`}
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={btn.icon}
                                    size={16}
                                    color="#FFFFFF"
                                    style={{ marginRight: 4 }}
                                />
                                <Text className="text-white font-semibold text-sm">{btn.label}</Text>
                            </View>
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
            contentContainerStyle={{ paddingVertical: 0 }}
            ListHeaderComponent={renderListHeader} // استخدام الرأس القابل للتمرير
        />
    );
};

export default LearningList;