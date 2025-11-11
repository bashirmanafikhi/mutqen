import { useSettings } from '@/context/AppSettingContext';
import { Surah } from '@/models/QuranModels';
import { fetchAllSurahs } from '@/services/data/surahQueries';
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
import QuranProgressBar from './QuranProgressBar';

interface SurahModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectSurah: (surah: Surah) => void;
}

export default function SelectSurahModal({ isVisible, onClose, onSelectSurah }: SurahModalProps) {
  const { isDark } = useSettings();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSurahs() {
      if (surahs.length > 0) return;

      try {
        const data: Surah[] = await fetchAllSurahs();
        setSurahs(data);
      } catch (error) {
        console.error("فشل تحميل قائمة السور:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isVisible && surahs.length === 0) loadSurahs();
  }, [isVisible]);

  const handleSelect = (item: Surah) => {
    onSelectSurah(item);
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<Surah>) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      activeOpacity={0.85}
      className={`flex-col p-4 rounded-2xl mb-3 shadow-sm border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className={`text-lg font-bold w-8 text-center ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            {item.id}
          </Text>
          <Text className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {item.name}
          </Text>
        </View>

        <View className="flex-row text-right">
          <Text className={`text-sm mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.aya_count} آية</Text>
          <Text
            className={`text-sm font-medium ${
              item.revelation_place === 'مدنيه'
                ? isDark ? 'text-blue-400' : 'text-blue-500'
                : isDark ? 'text-green-400' : 'text-green-500'
            }`}
          >
            {item.revelation_place}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <QuranProgressBar firstWordId={item.first_word_id} lastWordId={item.last_word_id} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/50">
        <View className={`flex-1 mt-16 rounded-t-3xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          
          {/* Header */}
          <View
            className={`p-5 flex-row justify-between items-center border-b ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>قائمة السور</Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1">
              <Text className="text-lg font-bold text-red-500 dark:text-red-400">إغلاق</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#4F46E5'} />
              <Text className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>جاري تحميل السور...</Text>
            </View>
          ) : (
            <FlatList<Surah> data={surahs} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
