// src/components/SelectSurahModal.tsx

import { Surah } from '@/models/QuranModels';
import { fetchAllSurahs } from '@/services/data/QuranQueries';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import QuranProgressBar from './QuranProgressBar';

// ===============================================
// Interfaces
// ===============================================
interface SurahModalProps {
  isVisible: boolean;
  onClose: () => void;
  // Now returns the full Surah object to the parent
  onSelectSurah: (surah: Surah) => void; 
}

// ===============================================
// Component
// ===============================================
export default function SelectSurahModal({ isVisible, onClose, onSelectSurah }: SurahModalProps) {
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSurahs() {
      if (surahs.length > 0) return; // Optimization: only fetch once
      
      try {
        const data: Surah[] = await fetchAllSurahs();
        setSurahs(data);
      } catch (error) {
        console.error("فشل تحميل قائمة السور:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Load data when the component is mounted for the first time
    if (isVisible && surahs.length === 0) {
      loadSurahs();
    }
  }, [isVisible]);

  const handleSelect = (item: Surah) => {
    onSelectSurah(item); // Pass the full object
    onClose(); 
  };

  const renderItem = ({ item }: ListRenderItemInfo<Surah>) => (
  <TouchableOpacity
    className="flex-col p-3 border-b border-gray-200 active:bg-gray-100"
    onPress={() => handleSelect(item)}
  >
    {/* Top Row: Number and Name */}
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center">
        <Text className="text-lg text-blue-600 font-bold ml-3 w-8 text-center">{item.id}</Text>
        <Text className="text-xl font-arabic font-semibold">{item.name}</Text>
      </View>

      <View className="flex-row text-right">
        <Text className="text-sm text-gray-500 mr-2">{item.aya_count} آية</Text>
        <Text className={`text-sm font-medium ${item.revelation_place === 'مدنيه' ? 'text-blue-500' : 'text-green-500'}`}>
          {item.revelation_place}
        </Text>
      </View>
    </View>

    {/* Bottom Row: Progress Bar */}
    <View className="mt-3">
      <QuranProgressBar firstWordId={item.start_word_id} lastWordId={item.end_word_id} />
    </View>
  </TouchableOpacity>
);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/50">
        <View className="flex-1 bg-white mt-10 rounded-t-xl overflow-hidden">
          
          {/* Modal Header */}
          <View className="p-4 border-b border-gray-200 bg-gray-50 flex-row justify-between items-center">
            <Text className="text-2xl font-bold">قائمة السور</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold text-red-500">إغلاق</Text>
            </TouchableOpacity>
          </View>
          
          {/* List Content */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل السور...</Text>
            </View>
          ) : (
            <FlatList<Surah> 
              data={surahs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
            />
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}