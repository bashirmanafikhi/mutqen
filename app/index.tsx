// import { Text, View } from 'react-native';
// // تم تعديل المسار لافتراض أن مجلد context هو في المستوى الأعلى بالنسبة لـ app
// import { useSettings } from '../context/AppSettingContext';
// // استخدام مكتبة safe-area-context الموصى بها
// import { SafeAreaView } from 'react-native-safe-area-context';

// // هذا المكون يمثل الصفحة الرئيسية التي يتم عرضها عبر <Slot />
// export default function IndexScreen() {
//   // افترض أن useSettings يعطينا إعدادات المستخدم
//   // مثل حجم الخط وحالة الوضع الداكن/الفاتح
//   const { isDark, fontSize } = useSettings();

//   // يتم تحديد حجم الخط ديناميكياً بناءً على إعدادات المستخدم
//   const dynamicFontSizeStyle = { fontSize: fontSize || 16 };
  
//   // لضمان قراءة النص القرآني بشكل أفضل، يتم زيادة حجم الخط وارتفاع السطر (Line Height)
//   const hafsStyle = {
//     fontSize: fontSize ? fontSize * 1.6 : 24, 
//     lineHeight: fontSize ? fontSize * 2.5 : 40
//   };

//   return (
//     // SafeAreaView لتجنب تداخل المحتوى مع النوتش/شريط النظام
//     // نستخدم كلاسات Tailwind للألوان والتخطيط
//     <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
//       <View className="p-8 rounded-xl shadow-2xl w-11/12 max-w-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        
//         {/* العنوان */}
//         <Text 
//           className="text-center font-bold mb-4 text-xl text-gray-900 dark:text-gray-100" 
//         >
//           مثال خط حفص (Tailwind)
//         </Text>

//         {/* النص القرآني الذي يستخدم خط حفص 
//             (يجب أن يكون 'font-uthmanic' معرفاً في tailwind.config.js) */}
//         <Text 
//           className="text-center font-uthmanic text-2xl mb-6 text-emerald-700 dark:text-emerald-400" 
//           style={hafsStyle}
//         >
//           بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ 
//         </Text>
        
//         {/* نص عادي */}
//         <Text 
//           className="text-center text-gray-700 dark:text-gray-300 mt-2"
//           style={dynamicFontSizeStyle}
//         >
//           هذا مثال لتطبيق خط مخصص على نصوص محددة، بينما يستخدم باقي التطبيق الخط الافتراضي (مثل Calibri). 
//         </Text>

//         {/* عرض حالة الثيم وحجم الخط */}
//         <View className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
//             <Text 
//               className="text-center font-medium text-sm text-gray-600 dark:text-gray-400"
//               style={{ fontSize: fontSize * 0.9 }}
//             >
//               الوضع الحالي: {isDark ? 'الداكن (Dark)' : 'الفاتح (Light)'} | حجم الخط: {fontSize}px
//             </Text>
//         </View>

//       </View>
//     </SafeAreaView>
//   );
// }
