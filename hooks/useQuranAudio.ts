// hooks/useQuranAudio.ts

import { Audio } from 'expo-av';
import { useCallback, useEffect, useState } from 'react';

interface AyaIdentifier {
    sura_id: number;
    aya_number: number;
}

// 🔗 API Link: Using everyayah.com (Alafasy) as a reliable public source.
const getAudioUrl = (sura_id: number, aya_number: number): string => {
    // Format: Sura (3 digits) + Aya (3 digits) -> e.g., 001007.mp3
    const suraPadded = sura_id.toString().padStart(3, '0');
    const ayaPadded = aya_number.toString().padStart(3, '0');
    return `https://everyayah.com/data/Alafasy_128kbps/${suraPadded}${ayaPadded}.mp3`;
};

/**
 * Custom hook to manage audio playback for a single Quran verse.
 */
export const useAudioPlayer = () => {
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const [playbackInstance, setPlaybackInstance] = useState<Audio.Sound | null>(null);

    // Helper to build key
    const ayaKey = (sura: number, aya: number) => `${sura}-${aya}`;

    // 🔊 Play/Pause Toggle Function
    const onPlayPause = useCallback(async (item: AyaIdentifier) => {
        const key = ayaKey(item.sura_id, item.aya_number);
        const isCurrentlyPlaying = playingKey === key;

        if (playbackInstance) {
            if (isCurrentlyPlaying) {
                // 🛑 Pause the current playing verse
                await playbackInstance.pauseAsync();
                setPlayingKey(null);
                return;
            } else {
                // 🔇 Unload the previous one if we switch verses
                await playbackInstance.unloadAsync();
                setPlaybackInstance(null);
                setPlayingKey(null);
            }
        }

        try {
            // 🎧 Play the new verse
            const url = getAudioUrl(item.sura_id, item.aya_number);
            const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            // Set a handler for when playback finishes
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingKey(null);
                    sound.unloadAsync();
                    setPlaybackInstance(null);
                }
            });

            setPlaybackInstance(sound);
            setPlayingKey(key);

        } catch (error) {
            console.error('Failed to load or play audio:', error);
            setPlayingKey(null);
        }
    }, [playingKey, playbackInstance]);

    // 🧹 Cleanup on component unmount
    useEffect(() => {
        return playbackInstance
            ? () => {
                playbackInstance.unloadAsync();
            }
            : undefined;
    }, [playbackInstance]);

    return { playingKey, onPlayPause, ayaKey };
};