// app/(train)/_layout.tsx
import { useSettings } from '@/context/AppSettingContext';
import { Stack } from 'expo-router';
import { ColorValue } from 'react-native';

export default function TrainLayout() {
  const { isDark } = useSettings();

  const headerBg: ColorValue = isDark ? '#1f2937' : '#ffffff';
  const headerText: ColorValue = isDark ? '#f9fafb' : '#111827';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: headerText,
      }}
    >
      {/* All training pages go here */}
      {/* You can hide headers on specific screens if needed */}
    </Stack>
  );
}
