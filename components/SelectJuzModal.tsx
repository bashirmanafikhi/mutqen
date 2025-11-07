import { useSettings } from '@/context/AppSettingContext';
import { QuranJuz } from '@/models/QuranModels';
import { fetchAllJuzs } from '@/services/data/QuranQueries';
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
import QuranProgressBar from './QuranProgressBar';

interface JuzModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectJuz: (juz: QuranJuz) => void;
}

export default function SelectJuzModal({ isVisible, onClose, onSelectJuz }: JuzModalProps) {
  const { isDark } = useSettings();
  const [juzs, setJuzs] = useState<QuranJuz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadJuzs() {
      if (juzs.length > 0) return;

      try {
        const data: QuranJuz[] = await fetchAllJuzs();
        setJuzs(data);
      } catch (error) {
        console.error("❌ فشل تحميل قائمة الأجزاء:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isVisible && juzs.length === 0) {
      loadJuzs();
    }
  }, [isVisible]);

  const handleSelect = (item: QuranJuz) => {
    onSelectJuz(item);
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<QuranJuz>) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSelect(item)}
      className={`mx-4 mb-3 p-4 rounded-2xl border shadow-sm ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <View className="flex-row items-center mb-3">
        <Text className={`w-8 text-center text-xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
          {item.id}
        </Text>
        <Text className={`ml-3 text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          {item.name}
        </Text>
      </View>

      <QuranProgressBar firstWordId={item.first_word_id} lastWordId={item.last_word_id} />
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
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              قائمة الأجزاء
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-500 dark:text-red-400">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* List Content */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#4F46E5'} />
              <Text className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                جاري تحميل الأجزاء...
              </Text>
            </View>
          ) : (
            <FlatList<QuranJuz>
              data={juzs}
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
