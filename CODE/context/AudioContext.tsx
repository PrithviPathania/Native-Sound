// Native Sound — Global Audio Context
// Uses expo-audio's imperative createAudioPlayer API so the single player
// instance persists across all screen transitions.
//
// Design: the AudioPlayer lives in a module-level ref inside the provider.
// Status updates are pushed in via player.addListener('playbackStatusUpdate').
// This avoids using the hook-only useAudioPlayerStatus inside a Context.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioStatus } from 'expo-audio';
import type { Track } from '../types/track';
import { getAllTracks } from '../services/database';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AudioContextValue {
  currentTrack: Track | null;
  tracks: Track[];         // All tracks loaded from SQLite
  isPlaying: boolean;
  currentTime: number;   // seconds
  duration: number;      // seconds (0 when unknown)
  volume: number;        // 0.0–1.0
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  setVolume: (vol: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  refreshTracks: () => Promise<void>;
}

const AudioContext = createContext<AudioContextValue | null>(null);

// ---------------------------------------------------------------------------
// AudioProvider
// ---------------------------------------------------------------------------
export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);

  // The player is held in a ref so it survives re-renders without re-creating.
  const playerRef = useRef<AudioPlayer | null>(null);

  // ---------------------------------------------------------------------------
  // One-time audio session configuration + initial track load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    // Load all tracks from SQLite so playNext/playPrevious can navigate them.
    getAllTracks()
      .then(setTracks)
      .catch((err) => console.error('[AudioContext] Failed to load tracks:', err));

    return () => {
      // Release player when the provider tree unmounts (app close).
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // refreshTracks — call after importing new tracks
  // ---------------------------------------------------------------------------
  const refreshTracks = useCallback(async () => {
    try {
      const latest = await getAllTracks();
      setTracks(latest);
    } catch (err) {
      console.error('[AudioContext] refreshTracks error:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Subscribe to playback status updates from the player
  // ---------------------------------------------------------------------------
  // Called once whenever we create or swap the player instance.
  const subscribeToPlayer = useCallback((player: AudioPlayer) => {
    const subscription = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        setIsPlaying(status.playing);
        setCurrentTime(status.currentTime ?? 0);
        setDuration(status.duration ?? 0);

        // Handle track end: update playing state
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTime(0);
        }

        // Surface playback errors
        if (status.error) {
          console.error('[AudioContext] Playback error:', status.error);
          Alert.alert('Playback Error', 'Unable to play this track.');
          setIsPlaying(false);
        }
      }
    );
    return subscription;
  }, []);

  // ---------------------------------------------------------------------------
  // playTrack
  // ---------------------------------------------------------------------------
  const playTrack = useCallback(
    async (track: Track) => {
      try {
        const trackUri = track.uri || track.fileUri;
        if (!trackUri) {
          Alert.alert('Playback Error', 'This track has no valid file path.');
          return;
        }

        if (playerRef.current) {
          // Reuse the existing player instance — swap the source.
          playerRef.current.replace({ uri: trackUri });
          playerRef.current.volume = volume;
          playerRef.current.play();
        } else {
          // First play: create the player imperatively.
          const player = createAudioPlayer(
            { uri: trackUri },
            { updateInterval: 250 }  // 250 ms → smooth progress bar
          );
          player.volume = volume;
          playerRef.current = player;
          subscribeToPlayer(player);
          player.play();
        }

        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track.duration ?? 0);
        setIsPlaying(true);
      } catch (err) {
        console.error('[AudioContext] playTrack error:', err);
        Alert.alert('Playback Error', 'Failed to load the audio file.');
      }
    },
    [volume, subscribeToPlayer]
  );

  // ---------------------------------------------------------------------------
  // togglePlayPause
  // ---------------------------------------------------------------------------
  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      // State will sync via playbackStatusUpdate listener, but set eagerly
      // so the UI responds immediately.
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // ---------------------------------------------------------------------------
  // seekTo
  // ---------------------------------------------------------------------------
  const seekTo = useCallback(async (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      await player.seekTo(seconds);
      setCurrentTime(seconds);
    } catch (err) {
      console.error('[AudioContext] seekTo error:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // setVolume
  // ---------------------------------------------------------------------------
  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (playerRef.current) {
      playerRef.current.volume = clamped;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // playNext / playPrevious — wrap-around looping through the tracks array
  // ---------------------------------------------------------------------------
  const playNext = useCallback(async () => {
    if (tracks.length === 0) return;
    if (!currentTrack) {
      await playTrack(tracks[0]);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = idx === -1 || idx === tracks.length - 1 ? 0 : idx + 1;
    await playTrack(tracks[nextIdx]);
  }, [tracks, currentTrack, playTrack]);

  const playPrevious = useCallback(async () => {
    if (tracks.length === 0) return;
    if (!currentTrack) {
      await playTrack(tracks[tracks.length - 1]);
      return;
    }
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1;
    await playTrack(tracks[prevIdx]);
  }, [tracks, currentTrack, playTrack]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        tracks,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        playNext,
        playPrevious,
        refreshTracks,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useAudio hook
// ---------------------------------------------------------------------------
export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an <AudioProvider>');
  }
  return ctx;
}
