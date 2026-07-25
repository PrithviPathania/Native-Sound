// Native Sound — Global Audio Context
// Provides a single AudioPlayer instance and global playback state
// to the entire app via React Context.
//
// Uses createAudioPlayer (imperative API) instead of useAudioPlayer because
// the player must persist beyond any single component's lifecycle.
// Per the expo-audio v57 docs, we are responsible for calling player.release()
// in the cleanup effect.

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

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AudioContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

// ---------------------------------------------------------------------------
// AudioProvider
// ---------------------------------------------------------------------------
export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep a stable ref to the player so we don't re-create it on every render.
  const playerRef = useRef<AudioPlayer | null>(null);

  // Configure the audio session once on mount.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    // Cleanup: release the player when the provider unmounts (app close).
    return () => {
      playerRef.current?.release();
      playerRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // playTrack
  // ---------------------------------------------------------------------------
  // Loads a new track URI into the player and starts playback.
  const playTrack = useCallback(async (track: Track) => {
    try {
      if (playerRef.current) {
        // Replace the source on the existing player instance.
        // `replace` is the v57 method for swapping sources without
        // destroying and recreating the player.
        playerRef.current.replace({ uri: track.fileUri });
        playerRef.current.play();
      } else {
        // First-time play: create the player imperatively.
        const player = createAudioPlayer({ uri: track.fileUri });
        playerRef.current = player;
        player.play();
      }

      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('[AudioContext] playTrack error:', error);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // togglePlayPause
  // ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// useAudio
// ---------------------------------------------------------------------------
// Throws if consumed outside <AudioProvider>.
export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an <AudioProvider>');
  }
  return ctx;
}
