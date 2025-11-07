import { useSettings } from '@/context/AppSettingContext';
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

interface SahabaModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectDivision: (division: QuranDivision) => void;
}

export default function SelectSahabaDivisionModal({
  isVisible,
  onClose,
  onSelectDivision,
}: SahabaModalProps) {
  const { isDark } = useSettings();
  const [divisions, setDivisions] = useState<QuranDivision[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDivisions() {
      if (divisions.length > 0) return;

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
      className={`mx-4 mb-3 p-4 rounded-2xl shadow-sm border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <Text className={`text-lg font-bold text-center ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
        {item.name}
      </Text>
      <Text className={`text-sm text-center mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
        تقسيم الصحابة
      </Text>
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
        <View className={`flex-1 mt-16 rounded-t-3xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>

          {/* Header */}
          <View className={`p-5 flex-row justify-between items-center border-b ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              تقسيم الصحابة
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-500 dark:text-red-400">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#4F46E5'} />
              <Text className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                جاري تحميل الأقسام...
              </Text>
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
