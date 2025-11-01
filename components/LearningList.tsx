// src/components/LearningList.tsx

import { LearningItemDisplay } from '@/models/QuranModels'; // Use the display interface
import { Link } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, ListRenderItemInfo, Text, TouchableOpacity, View } from 'react-native';

// ===============================================
// Interfaces
// ===============================================
interface LearningListProps {
  learnings: LearningItemDisplay[];
  isLoading: boolean;
  onDeleteLearning: (id: number) => void;
}

// ===============================================
// Presentational Component
// ===============================================
const LearningList: React.FC<LearningListProps> = ({ learnings, isLoading, onDeleteLearning }) => {

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-lg text-gray-500">جاري تحميل قائمة المحفوظات...</Text>
      </View>
    );
  }

  if (learnings.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-xl text-gray-500 text-center">
          لا يوجد لديك أي محفوظات بعد. اضغط على "+" لإضافة عنصر جديد!
        </Text>
      </View>
    );
  }

  // Helper function to show a confirmation alert
  const confirmDelete = (item: LearningItemDisplay) => {
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

  const renderItem = ({ item }: ListRenderItemInfo<LearningItemDisplay>) => (
    <View className="flex-row justify-between items-center p-4 border-b border-gray-100 bg-white">
      
      {/* Learning Details (Main Content) */}
      <View className="flex-1 mr-4"> 
          <Text className="text-xl font-bold text-gray-900 mb-1">{item.title}</Text>
          <Text className="text-base text-indigo-600 mb-1">
              {item.sura_name} - الآيات: {item.start_aya} - {item.end_aya}
          </Text>
          <Text className="text-sm text-gray-500">{item.display_text}</Text>
          <Text className="text-xs text-gray-400 mt-1 self-start">{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      

      
     {/* Action Buttons (NEW) */}
      <View className="flex-row items-center space-x-2">
        
        {/* Train Button (NEW) */}
        <Link 
            // Navigate to the new route, passing the learning object's essential IDs
            href={{
                pathname: "/(train)/[...learningId]",
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
                className="bg-indigo-500 p-2 rounded-lg w-16 justify-center items-center h-10"
            >
                <Text className="text-white font-bold text-sm">تدريب</Text>
            </TouchableOpacity>
        </Link>
        
        {/* Delete Button (EXISTING) */}
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          className="bg-red-500 p-2 rounded-lg w-16 justify-center items-center h-10"
        >
          <Text className="text-white font-bold text-sm">حذف</Text>
        </TouchableOpacity>
      
      </View>
      
    </View>
  );

  return (
    <FlatList
      data={learnings}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      className="flex-1"
    />
  );
};

export default LearningList;