// Native Sound — Global Audio Context
// Provides a single AudioPlayer instance and global playback state.
// Manages playback, shuffle, repeat, volume, seeking, and SQLite tracks.

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
import { getAllTracks, toggleLikeTrack, deleteTrack } from '../services/database';

export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioContextValue {
  currentTrack: Track | null;
  tracks: Track[];
  isPlaying: boolean;
  currentTime: number;   // seconds
  duration: number;      // seconds (0 when unknown)
  volume: number;        // 0.0–1.0
  isShuffled: boolean;
  repeatMode: RepeatMode;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  setVolume: (vol: number) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  refreshTracks: () => Promise<void>;
  toggleLike: (trackId: number) => Promise<boolean>;
  removeTrack: (trackId: number) => Promise<void>;
  likedTracks: Track[];
  playAll: () => Promise<void>;
  shuffleAll: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);

  // Shuffle & Repeat state
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Shuffle queue tracking
  const shuffleQueueRef = useRef<Track[]>([]);
  const shuffleIndexRef = useRef<number>(0);

  // Audio player singleton ref
  const playerRef = useRef<AudioPlayer | null>(null);
  const playNextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // One-time audio session configuration
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    getAllTracks()
      .then(setTracks)
      .catch((err) => console.error('[AudioContext] Failed to load tracks:', err));

    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const refreshTracks = useCallback(async () => {
    try {
      const latest = await getAllTracks();
      setTracks(latest);
    } catch (err) {
      console.error('[AudioContext] refreshTracks error:', err);
    }
  }, []);

  // Status listener
  const subscribeToPlayer = useCallback((player: AudioPlayer) => {
    const subscription = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        setIsPlaying(status.playing);
        setCurrentTime(status.currentTime ?? 0);
        setDuration(status.duration ?? 0);

        // Auto-advance when track finishes
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTime(0);
          playNextRef.current?.();
        }

        if (status.error) {
          console.error('[AudioContext] Playback error:', status.error);
          Alert.alert('Playback Error', 'Unable to play this track.');
          setIsPlaying(false);
        }
      }
    );
    return subscription;
  }, []);

  // playTrack
  const playTrack = useCallback(
    async (track: Track) => {
      try {
        const trackUri = track.uri || track.fileUri;
        if (!trackUri) {
          Alert.alert('Playback Error', 'This track has no valid file path.');
          return;
        }

        if (playerRef.current) {
          playerRef.current.replace({ uri: trackUri });
          playerRef.current.volume = volume;
          playerRef.current.play();
        } else {
          const player = createAudioPlayer(
            { uri: trackUri },
            { updateInterval: 250 }
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

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (playerRef.current) {
      playerRef.current.volume = clamped;
    }
  }, []);

  // Helper to build/refresh shuffle queue
  const buildShuffleQueue = useCallback((allTracks: Track[], startWith?: Track | null) => {
    if (allTracks.length === 0) return [];
    if (!startWith) {
      return shuffleArray(allTracks);
    }
    const remaining = allTracks.filter((t) => t.id !== startWith.id);
    return [startWith, ...shuffleArray(remaining)];
  }, []);

  // toggleShuffle
  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const nextState = !prev;
      if (nextState && tracks.length > 0) {
        shuffleQueueRef.current = buildShuffleQueue(tracks, currentTrack);
        shuffleIndexRef.current = 0;
      }
      return nextState;
    });
  }, [tracks, currentTrack, buildShuffleQueue]);

  // toggleRepeat
  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // playAll
  const playAll = useCallback(async () => {
    if (tracks.length === 0) return;
    setIsShuffled(false);
    await playTrack(tracks[0]);
  }, [tracks, playTrack]);

  // shuffleAll
  const shuffleAll = useCallback(async () => {
    if (tracks.length === 0) return;
    const queue = buildShuffleQueue(tracks);
    shuffleQueueRef.current = queue;
    shuffleIndexRef.current = 0;
    setIsShuffled(true);
    await playTrack(queue[0]);
  }, [tracks, buildShuffleQueue, playTrack]);

  // playNext
  const playNext = useCallback(async () => {
    if (tracks.length === 0) return;

    // Repeat one mode
    if (repeatMode === 'one' && currentTrack) {
      await seekTo(0);
      playerRef.current?.play();
      setIsPlaying(true);
      return;
    }

    if (isShuffled) {
      if (shuffleQueueRef.current.length === 0) {
        shuffleQueueRef.current = buildShuffleQueue(tracks, currentTrack);
        shuffleIndexRef.current = 0;
      }

      let nextIdx = shuffleIndexRef.current + 1;
      if (nextIdx >= shuffleQueueRef.current.length) {
        if (repeatMode === 'all') {
          shuffleQueueRef.current = buildShuffleQueue(tracks);
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      shuffleIndexRef.current = nextIdx;
      await playTrack(shuffleQueueRef.current[nextIdx]);
    } else {
      if (!currentTrack) {
        await playTrack(tracks[0]);
        return;
      }
      const idx = tracks.findIndex((t) => t.id === currentTrack.id);
      let nextIdx = idx + 1;

      if (nextIdx >= tracks.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      await playTrack(tracks[nextIdx]);
    }
  }, [tracks, currentTrack, isShuffled, repeatMode, buildShuffleQueue, playTrack, seekTo]);

  // Keep playNextRef up-to-date for auto-advance listener
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // playPrevious
  const playPrevious = useCallback(async () => {
    if (tracks.length === 0) return;

    // If track has been playing for more than 3 seconds, restart it
    if (currentTimeRef.current > 3) {
      await seekTo(0);
      playerRef.current?.play();
      setIsPlaying(true);
      return;
    }

    if (isShuffled) {
      if (shuffleIndexRef.current > 0) {
        shuffleIndexRef.current -= 1;
        await playTrack(shuffleQueueRef.current[shuffleIndexRef.current]);
      } else if (repeatMode === 'all' && shuffleQueueRef.current.length > 0) {
        shuffleIndexRef.current = shuffleQueueRef.current.length - 1;
        await playTrack(shuffleQueueRef.current[shuffleIndexRef.current]);
      } else {
        await seekTo(0);
      }
    } else {
      if (!currentTrack) {
        await playTrack(tracks[tracks.length - 1]);
        return;
      }
      const idx = tracks.findIndex((t) => t.id === currentTrack.id);
      let prevIdx = idx <= 0 ? (repeatMode === 'all' ? tracks.length - 1 : 0) : idx - 1;
      await playTrack(tracks[prevIdx]);
    }
  }, [tracks, currentTrack, isShuffled, repeatMode, playTrack, seekTo]);

  // toggleLike
  const toggleLike = useCallback(async (trackId: number): Promise<boolean> => {
    let newLiked = false;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        newLiked = !(t.liked ?? t.isLiked ?? false);
        return { ...t, liked: newLiked, isLiked: newLiked };
      })
    );
    setCurrentTrack((prev) => {
      if (!prev || prev.id !== trackId) return prev;
      newLiked = !(prev.liked ?? prev.isLiked ?? false);
      return { ...prev, liked: newLiked, isLiked: newLiked };
    });

    try {
      const authoritative = await toggleLikeTrack(trackId);
      if (authoritative !== newLiked) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === trackId
              ? { ...t, liked: authoritative, isLiked: authoritative }
              : t
          )
        );
        setCurrentTrack((prev) =>
          prev && prev.id === trackId
            ? { ...prev, liked: authoritative, isLiked: authoritative }
            : prev
        );
      }
      return authoritative;
    } catch (err) {
      console.error('[AudioContext] toggleLike error:', err);
      const rolled = !newLiked;
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, liked: rolled, isLiked: rolled } : t
        )
      );
      setCurrentTrack((prev) =>
        prev && prev.id === trackId
          ? { ...prev, liked: rolled, isLiked: rolled }
          : prev
      );
      throw err;
    }
  }, []);

  // removeTrack — deletes from DB + files, then removes from state.
  // If the deleted track is currently playing, stop the player and clear it.
  const removeTrack = useCallback(async (trackId: number) => {
    try {
      await deleteTrack(trackId);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setCurrentTrack((prev) => {
        if (prev && prev.id === trackId) {
          playerRef.current?.pause();
          setIsPlaying(false);
          return null;
        }
        return prev;
      });
    } catch (err) {
      console.error('[AudioContext] removeTrack error:', err);
      Alert.alert('Delete Failed', 'Could not remove this track.');
    }
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        tracks,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffled,
        repeatMode,
        playTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        playNext,
        playPrevious,
        refreshTracks,
        toggleLike,
        removeTrack,
        likedTracks: tracks.filter((t) => t.liked || t.isLiked),
        playAll,
        shuffleAll,
        toggleShuffle,
        toggleRepeat,
      }}
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
