import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
// استيراد الواجهة والدالة من خدمة قاعدة البيانات
import { fetchAllSurahs, Surah } from '../services/DatabaseService';

// ===============================================
// واجهة (Interface) لتمثيل خواص المكون (Props)
// ===============================================
interface SurahModalProps {
  isVisible: boolean;
  onClose: () => void;
  // الدالة التي يتم استدعاؤها عند اختيار سورة
  onSelectSurah: (id: number, name: string) => void;
}

export default function SurahModal({ isVisible, onClose, onSelectSurah }: SurahModalProps) {
  
  // تحديد نوع متغير الحالة Surah[] و boolean
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSurahs() {
      try {
        const data: Surah[] = await fetchAllSurahs();
        setSurahs(data);
        console.log("تم تحميل قائمة السور بنجاح.");
      } catch (error) {
        console.error("فشل تحميل قائمة السور:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isVisible && surahs.length === 0) {
      loadSurahs();
    }
  }, [isVisible]);

  // تحديد نوع العنصر الذي يتم عرضه في FlatList
  const renderItem = ({ item }: ListRenderItemInfo<Surah>) => (
    <TouchableOpacity
      className="flex-row justify-between items-center p-3 border-b border-gray-200 active:bg-gray-100"
      onPress={() => {
        // تمرير البيانات للدالة المحددة من المكون الأب
        onSelectSurah(item.id, item.name);
        onClose(); // إغلاق الـ Modal عند الاختيار
      }}
    >
      {/* القسم الأيمن: رقم واسم السورة */}
      <View className="flex-row items-center">
        {/* استخدام Tailwind لتنسيق ثابت للرقم */}
        <Text className="text-lg text-blue-600 font-bold ml-3 w-8 text-center">{item.id}</Text>
        <Text className="text-xl font-arabic font-semibold">{item.name}</Text>
      </View>

      {/* القسم الأيسر: معلومات إضافية */}
      <View className="flex-row text-right">
        <Text className="text-sm text-gray-500 mr-2">{item.aya_count} آية</Text>
        {/* تنسيق مشروط بناءً على مكان التنزيل */}
        <Text className={`text-sm font-medium ${item.revelation_place === 'مدنيه' ? 'text-blue-500' : 'text-green-500'}`}>
          {item.revelation_place}
        </Text>
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
          
          {/* رأس الـ Modal */}
          <View className="p-4 border-b border-gray-200 bg-gray-50 flex-row justify-between items-center">
            <Text className="text-2xl font-bold">قائمة السور</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold text-red-500">إغلاق</Text>
            </TouchableOpacity>
          </View>
          
          {/* قائمة السور */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-2 text-lg text-gray-500">جاري تحميل السور...</Text>
            </View>
          ) : (
            // تحديد نوع البيانات في FlatList بشكل صريح
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