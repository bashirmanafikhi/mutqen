// app/(app)/rate.tsx

import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function RateScreen() { // <-- Must have 'export default'
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Stack.Screen options={{ title: "تقييم التطبيق" }} />
            <Text>Rate the App Content</Text>
        </View>
    );
}