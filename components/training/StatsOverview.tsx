// // src/components/training/StatsOverview.tsx
// import { useSettings } from '@/context/AppSettingContext';
// import { TrainingStats } from '@/models/TrainingModels';
// import { Ionicons } from '@expo/vector-icons';
// import React from 'react';
// import { Text, View } from 'react-native';

// interface StatsOverviewProps {
//   stats: TrainingStats;
//   isVisible: boolean;
// }

// const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isVisible }) => {
//   const { isDark } = useSettings();

//   if (!isVisible) return null;

//   return (
//     <View className={`mx-4 mb-4 p-4 rounded-2xl border ${
//       isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
//     } shadow-lg`}>
//       <Text className={`text-lg font-bold text-center mb-3 ${
//         isDark ? 'text-gray-100' : 'text-gray-900'
//       }`}>
//         إحصائيات الجلسة
//       </Text>

//       <View className="flex-row flex-wrap justify-between">
//         {/* Accuracy */}
//         <View className="items-center w-1/2 mb-4">
//           <View className="flex-row items-center mb-1">
//             <Ionicons 
//               name="trending-up" 
//               size={16} 
//               color={stats.accuracy >= 80 ? "#10B981" : stats.accuracy >= 60 ? "#F59E0B" : "#EF4444"} 
//             />
//             <Text className={`text-sm font-semibold mr-1 ${
//               isDark ? 'text-gray-300' : 'text-gray-700'
//             }`}>
//               الدقة
//             </Text>
//           </View>
//           <Text className={`text-2xl font-bold ${
//             stats.accuracy >= 80 ? 'text-green-600' : 
//             stats.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'
//           }`}>
//             {stats.accuracy}%
//           </Text>
//         </View>

//         {/* Current Streak */}
//         <View className="items-center w-1/2 mb-4">
//           <View className="flex-row items-center mb-1">
//             <Ionicons 
//               name="flame" 
//               size={16} 
//               color={stats.currentStreak > 5 ? "#F59E0B" : "#6B7280"} 
//             />
//             <Text className={`text-sm font-semibold mr-1 ${
//               isDark ? 'text-gray-300' : 'text-gray-700'
//             }`}>
//               التسلسل
//             </Text>
//           </View>
//           <Text className={`text-2xl font-bold ${
//             stats.currentStreak > 5 ? 'text-amber-600' : 'text-gray-600'
//           }`}>
//             {stats.currentStreak}
//           </Text>
//         </View>

//         {/* Words Reviewed */}
//         <View className="items-center w-1/2">
//           <View className="flex-row items-center mb-1">
//             <Ionicons name="checkmark-done" size={16} color="#6366F1" />
//             <Text className={`text-sm font-semibold mr-1 ${
//               isDark ? 'text-gray-300' : 'text-gray-700'
//             }`}>
//               تمت مراجعتها
//             </Text>
//           </View>
//           <Text className="text-2xl font-bold text-indigo-600">
//             {stats.wordsReviewed}
//           </Text>
//         </View>

//         {/* Words Memorized */}
//         <View className="items-center w-1/2">
//           <View className="flex-row items-center mb-1">
//             <Ionicons name="star" size={16} color="#8B5CF6" />
//             <Text className={`text-sm font-semibold mr-1 ${
//               isDark ? 'text-gray-300' : 'text-gray-700'
//             }`}>
//               محفوظة
//             </Text>
//           </View>
//           <Text className="text-2xl font-bold text-purple-600">
//             {stats.wordsMemorized}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default StatsOverview;