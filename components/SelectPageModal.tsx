// src/components/SelectPageModal.tsx

import { QuranPage } from '@/models/QuranModels';
import { fetchAllPages } from '@/services/data/QuranQueries';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

// ===============================================
// Interfaces
// ===============================================
interface PageModalProps {
  isVisible: boolean;
  onClose: () => void;
  // Returns the full QuranPage object
  onSelectPage: (page: QuranPage) => void; 
}

// ===============================================
// Component
// ===============================================
export default function SelectPageModal({ isVisible, onClose, onSelectPage }: PageModalProps) {
  
  const [pages, setPages] = useState<QuranPage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPages() {
      if (pages.length > 0) return; // Optimization: only fetch once
      
      try {
        // Fetching page IDs from quran_words table
        const data: QuranPage[] = await fetchAllPages(); 
        setPages(data);
      } catch (error) {
        console.error("فشل تحميل قائمة الصفحات:", error);
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
      className="p-4 border-b border-gray-200 active:bg-gray-100"
      onPress={() => handleSelect(item)}
    >
      <Text className="text-xl font-bold text-indigo-700 text-center">صفحة رقم {item.id}</Text>
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
            <Text className="text-2xl font-bold">قائمة الصفحات</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold text-red-500">إغلاق</Text>
            </TouchableOpacity>
          </View>
          
          {/* List Content */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل الصفحات...</Text>
            </View>
          ) : (
            <FlatList<QuranPage> 
              data={pages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3} // Display pages in a grid for better UX
              columnWrapperStyle={{ justifyContent: 'space-around' }}
            />
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}