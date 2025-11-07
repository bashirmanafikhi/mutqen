import { useSettings } from '@/context/AppSettingContext';
import { QuranPage } from '@/models/QuranModels';
import { fetchAllPages } from '@/services/data/QuranQueries';
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

interface PageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPage: (page: QuranPage) => void; 
}

export default function SelectPageModal({ isVisible, onClose, onSelectPage }: PageModalProps) {
  const { isDark } = useSettings();
  const [pages, setPages] = useState<QuranPage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPages() {
      if (pages.length > 0) return;

      try {
        const data: QuranPage[] = await fetchAllPages(); 
        setPages(data);
      } catch (error) {
        console.error("❌ فشل تحميل قائمة الصفحات:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isVisible && pages.length === 0) {
      loadPages();
    }
  }, [isVisible]);

  const handleSelect = (item: QuranPage) => {
    onSelectPage(item);
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<QuranPage>) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSelect(item)}
      className={`flex-1 m-2 p-4 rounded-2xl border shadow-sm justify-center items-center ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <Text className={`text-lg font-bold text-center ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
        صفحة {item.id}
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
              قائمة الصفحات
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-500 dark:text-red-400">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* Pages Grid */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#4F46E5'} />
              <Text className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                جاري تحميل الصفحات...
              </Text>
            </View>
          ) : (
            <FlatList<QuranPage>
              data={pages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={{ justifyContent: 'space-around', paddingVertical: 12 }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
