import { QuranDivision } from '@/models/QuranModels';
import { fetchAllSahabaDivisions } from '@/services/data/QuranQueries';
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
interface SahabaModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectDivision: (division: QuranDivision) => void;
}

// ===============================================
// Component
// ===============================================
export default function SelectSahabaDivisionModal({
  isVisible,
  onClose,
  onSelectDivision,
}: SahabaModalProps) {
  const [divisions, setDivisions] = useState<QuranDivision[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDivisions() {
      if (divisions.length > 0) return; // Optimization

      try {
        const data: QuranDivision[] = await fetchAllSahabaDivisions();
        setDivisions(data);
      } catch (error) {
        console.error('❌ فشل تحميل تقسيم الصحابة:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isVisible && divisions.length === 0) {
      loadDivisions();
    }
  }, [isVisible]);

  const handleSelect = (item: QuranDivision) => {
    onSelectDivision(item);
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<QuranDivision>) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleSelect(item)}
      className="mx-4 mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm"
    >
      <Text className="text-lg font-bold text-amber-800 text-center">{item.name}</Text>
      <Text className="text-sm text-center text-amber-600 mt-1">تقسيم الصحابة</Text>
    </TouchableOpacity>
  );

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
            <Text className="text-2xl font-bold text-gray-800">تقسيم الصحابة</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-600">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل الأقسام...</Text>
            </View>
          ) : (
            <FlatList<QuranDivision>
              data={divisions}
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
