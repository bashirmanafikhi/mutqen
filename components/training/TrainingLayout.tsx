// import { useTrainingWords } from '@/hooks/useTrainingWords';
// import { WordCard } from '@/models/QuranModels';
// import React, { useEffect, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
// import { ActivityIndicator, Dimensions, FlatList, Text, View } from 'react-native';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import HiddenCardArea from './HiddenCardArea';
// import RevealedList from './RevealedList';

// const SCREEN_HEIGHT = Dimensions.get('window').height;

// export default function TrainingLayout({
//   startWordId,
//   endWordId,
// }: {
//   startWordId: number;
//   endWordId: number;
// }) {
//   const { revealedWords, hiddenWords, isLoading, updateProgress, restart } =
//     useTrainingWords(startWordId, endWordId);

//   const listRef = useRef<FlatList<WordCard>>(null);
//   const previousLength = useRef(0);

//   useEffect(() => {
//     if (revealedWords.length > previousLength.current) {
//       // scroll to the bottom (latest revealed item)
//       setTimeout(() => {
//         listRef.current?.scrollToEnd({ animated: true });
//       }, 100);
//     }
//     previousLength.current = revealedWords.length;
//   }, [revealedWords.length]);

//   if (isLoading)
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
//         <ActivityIndicator size="large" color="#4F46E5" />
//         <Text className="mt-2 text-lg text-gray-500 dark:text-gray-300">
//           {useTranslation().t('training.loading')}
//         </Text>
//       </View>
//     );

//   return (
//     <View className="flex-1 bg-gray-50 dark:bg-gray-900">
//       {/* Revealed Words Section */}
//       <View
//         style={{ height: SCREEN_HEIGHT * 0.55 }}
//         className="px-4 py-3 border-b border-gray-200 dark:border-gray-700"
//       >
//         <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 text-center">
//           {useTranslation().t('training.revealed_title', { count: revealedWords.length })}
//         </Text>
//         <RevealedList ref={listRef} revealedWords={revealedWords} updateProgress={updateProgress} />
//       </View>

//       {/* Hidden Words / Card Area */}
//       <GestureHandlerRootView
//         style={{ flex: 1 }}
//         className="flex-1 p-4 bg-gray-100 dark:bg-gray-800"
//       >
//         <HiddenCardArea
//           hiddenWords={hiddenWords}
//           updateProgress={updateProgress}
//           restart={restart}
//         />
//       </GestureHandlerRootView>
//     </View>
//   );
// }
