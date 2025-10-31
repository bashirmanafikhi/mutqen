// src/components/SelectJuzModal.tsx

import { QuranJuz } from '@/models/QuranModels';
import { fetchAllJuzs } from '@/services/data/QuranQueries';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

// ===============================================
// Interfaces
// ===============================================
interface JuzModalProps {
  isVisible: boolean;
  onClose: () => void;
  // Returns the full QuranJuz object to the parent
  onSelectJuz: (juz: QuranJuz) => void; 
}

// ===============================================
// Component
// ===============================================
export default function SelectJuzModal({ isVisible, onClose, onSelectJuz }: JuzModalProps) {
  
  const [juzs, setJuzs] = useState<QuranJuz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadJuzs() {
      if (juzs.length > 0) return; // Optimization: only fetch once
      
      try {
        const data: QuranJuz[] = await fetchAllJuzs();
        setJuzs(data);
      } catch (error) {
        console.error("فشل تحميل قائمة الأجزاء:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Load data when the component is mounted for the first time
    if (isVisible && juzs.length === 0) {
      loadJuzs();
    }
  }, [isVisible]);

  const handleSelect = (item: QuranJuz) => {
    onSelectJuz(item); // Pass the full object
    onClose(); 
  };

  const renderItem = ({ item }: ListRenderItemInfo<QuranJuz>) => (
    <TouchableOpacity
      className="flex-row justify-between items-center p-3 border-b border-gray-200 active:bg-gray-100"
      onPress={() => handleSelect(item)}
    >
      {/* Juz Number */}
      <View className="flex-row items-center">
        <Text className="text-xl text-blue-600 font-bold ml-3 w-8 text-center">{item.id}</Text>
        <Text className="text-xl font-arabic font-semibold">{item.name}</Text>
      </View>

      {/* Info */}
      <View className="text-right">
        <Text className="text-sm text-gray-500">بداية Word ID: {item.first_word_id}</Text>
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
            <Text className="text-2xl font-bold">قائمة الأجزاء</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold text-red-500">إغلاق</Text>
            </TouchableOpacity>
          </View>
          
          {/* List Content */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل الأجزاء...</Text>
            </View>
          ) : (
            <FlatList<QuranJuz> 
              data={juzs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}