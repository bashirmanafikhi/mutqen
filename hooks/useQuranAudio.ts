import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

export interface AyaIdentifier {
  sura_id: number;
  aya_number: number;
}

const getAudioUrl = (sura_id: number, aya_number: number) =>
  `https://everyayah.com/data/Alafasy_128kbps/${sura_id
    .toString()
    .padStart(3, '0')}${aya_number.toString().padStart(3, '0')}.mp3`;

export const useQuranAudio = () => {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const player: AudioPlayer = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const ayaKey = (sura: number, aya: number) => `${sura}-${aya}`;

  const onPlayPause = useCallback(
    async (item: AyaIdentifier) => {
      const key = ayaKey(item.sura_id, item.aya_number);
      const isCurrentlyPlaying = playingKey === key;

      try {
        // Toggle pause/resume if same aya
        if (isCurrentlyPlaying) {
          if (status.playing) {
            await player.pause();
            setPlayingKey(null); // reset key on manual pause
          } else {
            await player.play();
            setPlayingKey(key); // resume playing
          }
          return;
        }

        // Stop any other playing aya
        if (playingKey) {
          await player.pause();
          setPlayingKey(null);
        }

        // Load new aya and play
        await player.replace(getAudioUrl(item.sura_id, item.aya_number));
        await player.play();
        setPlayingKey(key);

      } catch (err) {
        console.error("Audio playback error:", err);
        setPlayingKey(null);
      }
    },
    [playingKey, player, status.playing]
  );

  // // Automatically reset playingKey when audio ends or stops
  // useEffect(() => {
  //   if (!status.playing && playingKey) {
  //     setPlayingKey(null);
  //   }
  // }, [status.playing, playingKey]);

  useEffect(() => {
    if (status.didJustFinish) {
      setPlayingKey(null);
    }
  }, [status.didJustFinish]);

  return { playingKey, onPlayPause, ayaKey, status };
};
