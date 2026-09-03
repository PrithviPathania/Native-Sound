// Native Sound — Audio Duration Utility (utils/audioDuration.ts)
// Extracts audio duration asynchronously via a temporary expo-audio player.

import { createAudioPlayer } from 'expo-audio';

/**
 * Asynchronously extracts duration in seconds from an audio file using expo-audio.
 * Listens for native playbackStatusUpdate resolution and cleans up temporary player.
 */
export function readAudioDurationAsync(fileUri: string): Promise<number> {
  return new Promise((resolve) => {
    let resolved = false;
    let tempPlayer: ReturnType<typeof createAudioPlayer> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (tempPlayer) {
        try {
          if (typeof tempPlayer.remove === 'function') {
            tempPlayer.remove();
          }
        } catch (e) {
          console.warn('[audioDuration] Error releasing tempPlayer:', e);
        }
        tempPlayer = null;
      }
    };

    const finish = (durSeconds: number) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const validSecs = !durSeconds || isNaN(durSeconds) || durSeconds <= 0 ? 0 : Math.round(durSeconds);
      resolve(validSecs);
    };

    // Timeout safety fallback after 1.5s
    timeoutId = setTimeout(() => {
      finish(0);
    }, 1500);

    try {
      tempPlayer = createAudioPlayer({ uri: fileUri });

      // If duration is populated synchronously
      if (tempPlayer.duration && tempPlayer.duration > 0 && !isNaN(tempPlayer.duration)) {
        finish(tempPlayer.duration);
        return;
      }

      // Listen for async status updates when native audio loader resolves duration
      const sub = tempPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.duration && status.duration > 0 && !isNaN(status.duration)) {
          try {
            sub.remove();
          } catch {}
          finish(status.duration);
        }
      });
    } catch (err) {
      console.warn('[audioDuration] Error initializing tempPlayer:', err);
      finish(0);
    }
  });
}
