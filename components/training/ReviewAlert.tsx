// // src/components/training/ReviewAlert.tsx
// import { useSettings } from '@/context/AppSettingContext';
// import { DueReview } from '@/services/data/TrainingQueryService';
// import { Ionicons } from '@expo/vector-icons';
// import React, { useEffect } from 'react';
// import { Animated, Text, TouchableOpacity, View } from 'react-native';


// export interface ReviewAlertProps {
//   isVisible: boolean;
//   dueReview: DueReview | null;
//   onJumpToReview: () => void;
//   onDismiss: () => void;
//   onContinueAnyway: () => void;
// }

// const ReviewAlert: React.FC<ReviewAlertProps> = ({
//   isVisible,
//   dueReview,
//   onJumpToReview,
//   onDismiss,
//   onContinueAnyway
// }) => {
//   const { isDark } = useSettings();
//   const slideAnim = React.useRef(new Animated.Value(-100)).current;
//   const opacityAnim = React.useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (isVisible) {
//       Animated.parallel([
//         Animated.spring(slideAnim, {
//           toValue: 0,
//           useNativeDriver: true,
//           tension: 50,
//           friction: 8
//         }),
//         Animated.timing(opacityAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         })
//       ]).start();
//     } else {
//       Animated.parallel([
//         Animated.spring(slideAnim, {
//           toValue: -100,
//           useNativeDriver: true,
//           tension: 50,
//           friction: 8
//         }),
//         Animated.timing(opacityAnim, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         })
//       ]).start();
//     }
//   }, [isVisible, slideAnim, opacityAnim]);

//   if (!isVisible || !dueReview) return null;

//   return (
//     <Animated.View 
//       style={{ 
//         transform: [{ translateY: slideAnim }],
//         opacity: opacityAnim 
//       }}
//       className="absolute top-4 left-4 right-4 z-50"
//     >
//       <View className={`rounded-2xl p-4 shadow-2xl border-2 ${
//         isDark 
//           ? 'bg-yellow-900/90 border-yellow-600' 
//           : 'bg-yellow-50 border-yellow-200'
//       }`}>
//         {/* Header */}
//         <View className="flex-row items-center mb-3">
//           <Ionicons 
//             name="alert-circle" 
//             size={24} 
//             color={isDark ? "#FBBF24" : "#D97706"} 
//           />
//           <Text className={`text-lg font-bold mr-2 ${
//             isDark ? 'text-yellow-100' : 'text-yellow-900'
//           }`}>
//             كلمة تحتاج المراجعة
//           </Text>
//         </View>

//         {/* Review Info */}
//         <View className="mb-4">
//           <Text className={`text-base mb-1 ${
//             isDark ? 'text-yellow-200' : 'text-yellow-800'
//           }`}>
//             "{dueReview.word_text}"
//           </Text>
//           <Text className={`text-sm ${
//             isDark ? 'text-yellow-300' : 'text-yellow-700'
//           }`}>
//             {dueReview.sura_name} - آية {dueReview.aya_number}
//           </Text>
//         </View>

//         {/* Actions */}
//         <View className="flex-row justify-between space-x-3">
//           <TouchableOpacity
//             onPress={() => {
//                 onContinueAnyway();
//                 onDismiss();
//               }}
//             className={`flex-1 py-3 rounded-xl justify-center items-center ${
//               isDark ? 'bg-gray-700' : 'bg-gray-200'
//             }`}
//           >
//             <Text className={`font-semibold ${
//               isDark ? 'text-gray-300' : 'text-gray-700'
//             }`}>
//               استمر
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => {
//                 onJumpToReview();
//                 onDismiss();
//               }}
//             className={`flex-1 py-3 rounded-xl justify-center items-center ${
//               isDark ? 'bg-yellow-600' : 'bg-yellow-500'
//             }`}
//           >
//             <View className="flex-row items-center">
//               <Ionicons name="refresh" size={16} color="#FFFFFF" />
//               <Text className="text-white font-semibold mr-1">
//                 انتقل للمراجعة
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Animated.View>
//   );
// };

// export default ReviewAlert;