import { useSettings } from '@/context/AppSettingContext';
import { QuranDivision } from '@/models/QuranModels';
import { fetchAllHizbs } from '@/services/data/hizbQueries';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HizbModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectHizb: (hizb: QuranDivision) => void;
}

export default function SelectHizbModal({ isVisible, onClose, onSelectHizb }: HizbModalProps) {
  const { isDark } = useSettings();
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
        className={`mx-4 mb-3 p-5 rounded-3xl shadow-md border ${
          isQuarter
            ? `bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-700`
            : `bg-indigo-600 border-indigo-700 dark:bg-indigo-700 dark:border-indigo-800`
        }`}
      >
        <Text
          className={`text-lg font-semibold text-center ${
            isQuarter
              ? `text-gray-800 dark:text-gray-100`
              : `text-white dark:text-white`
          }`}
        >
          {item.name}
        </Text>
        <Text
          className={`text-sm text-center mt-1 ${
            isQuarter
              ? `text-gray-500 dark:text-gray-400`
              : `text-indigo-100 dark:text-indigo-200`
          }`}
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
        <View
          className={`flex-1 mt-16 rounded-t-3xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Header */}
          <View
            className={`p-5 flex-row justify-between items-center border-b ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Text
              className={`text-2xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-800'
              }`}
            >
              قائمة الأحزاب والأرباع
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
                جاري تحميل الأحزاب...
              </Text>
            </View>
          ) : (
            <FlatList<QuranDivision>
              data={hizbs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 16 }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
