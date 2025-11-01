// app/(app)/rate.tsx

import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function RateScreen() {
    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-8">
            <Stack.Screen options={{ title: "تقييم التطبيق" }} />
            <Text className='text-gray-700 dark:text-gray-200'>Rate the App Content</Text>

        </View>
    );
}