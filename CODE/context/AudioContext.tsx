// Native Sound — Global Audio Context
// Provides a single AudioPlayer instance and global playback state
// to the entire app via React Context.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import type { Track } from '../types/track';

interface AudioContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    return () => {
      playerRef.current?.release();
      playerRef.current = null;
    };
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    try {
      const trackUri = track.uri || track.fileUri;
      if (!trackUri) return;

      if (playerRef.current) {
        playerRef.current.replace({ uri: trackUri });
        playerRef.current.play();
      } else {
        const player = createAudioPlayer({ uri: trackUri });
        playerRef.current = player;
        player.play();
      }

      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('[AudioContext] playTrack error:', error);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <AudioContext.Provider
      value={{ currentTrack, isPlaying, playTrack, togglePlayPause }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an <AudioProvider>');
  }
  return ctx;
}
