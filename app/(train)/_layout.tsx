import { Stack } from 'expo-router';

export default function TrainLayout() {
    return (
        <Stack> 
            {/* This Stack contains only your training page. */}
            {/* <Stack.Screen 
                name="[...learningId]" 
                options={{ 
                    // We hide the header here and let the component ([...learningId].tsx) manage it.
                    headerShown: false,
                }}
            /> */}
        </Stack>
    );
}