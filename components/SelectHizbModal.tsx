import { QuranDivision } from '@/models/QuranModels';
import { fetchAllHizbs } from '@/services/data/QuranQueries';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ===============================================
// Interfaces
// ===============================================
interface HizbModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectHizb: (hizb: QuranDivision) => void;
}

// ===============================================
// Component
// ===============================================
export default function SelectHizbModal({ isVisible, onClose, onSelectHizb }: HizbModalProps) {
  const [hizbs, setHizbs] = useState<QuranDivision[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHizbs() {
      if (hizbs.length > 0) return;

      try {
        const data: QuranDivision[] = await fetchAllHizbs();
        setHizbs(data);
      } catch (error) {
        console.error('❌ فشل تحميل قائمة الأحزاب:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isVisible && hizbs.length === 0) {
      loadHizbs();
    }
  }, [isVisible]);

  const handleSelect = (item: QuranDivision) => {
    onSelectHizb(item);
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<QuranDivision>) => {
    const isQuarter = item.type === 'quarter-hizb';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelect(item)}
        className={`mx-4 mb-3 p-4 rounded-2xl shadow-sm border 
          ${isQuarter
            ? 'bg-gray-100 border-gray-200'
            : 'bg-indigo-600 border-indigo-700 shadow-md'
          }`}
      >
        <Text
          className={`text-lg font-bold text-center 
            ${isQuarter ? 'text-gray-800' : 'text-white'}`}
        >
          {item.name}
        </Text>
        <Text
          className={`text-sm text-center mt-1 
            ${isQuarter ? 'text-gray-500' : 'text-indigo-100'}`}
        >
          {isQuarter ? 'ربع حزب' : 'حزب كامل'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/50">
        <View className="flex-1 bg-white mt-10 rounded-t-3xl overflow-hidden">

          {/* Header */}
          <View className="p-5 border-b border-gray-200 bg-gray-50 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-gray-800">قائمة الأحزاب والأرباع</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-600">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل الأحزاب...</Text>
            </View>
          ) : (
            <FlatList<QuranDivision>
              data={hizbs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 12 }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
