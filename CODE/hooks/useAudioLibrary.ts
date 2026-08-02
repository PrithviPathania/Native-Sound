// Native Sound — Audio Library Hook (hooks/useAudioLibrary.ts)
// Provides react state management and CRUD operations for the track library.

import { useState, useCallback, useEffect } from 'react';
import { getAllTracks, deleteTrack as removeTrackFromDb } from '../db/database';
import { importAudioFiles } from '../services/fileImporter';
import type { Track } from '../types/track';

export function useAudioLibrary() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // refreshLibrary
  // ---------------------------------------------------------------------------
  const refreshLibrary = useCallback(async () => {
    try {
      const data = await getAllTracks();
      setTracks(data);
    } catch (err) {
      console.error('[useAudioLibrary] Error fetching tracks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // importTracks
  // ---------------------------------------------------------------------------
  const importTracks = useCallback(async (): Promise<Track[]> => {
    setLoading(true);
    try {
      const newTracks = await importAudioFiles();
      await refreshLibrary();
      return newTracks;
    } catch (err) {
      console.error('[useAudioLibrary] Error importing tracks:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [refreshLibrary]);

  // ---------------------------------------------------------------------------
  // deleteTrack
  // ---------------------------------------------------------------------------
  const deleteTrack = useCallback(async (id: number): Promise<void> => {
    try {
      await removeTrackFromDb(id);
      await refreshLibrary();
    } catch (err) {
      console.error(`[useAudioLibrary] Error deleting track ${id}:`, err);
    }
  }, [refreshLibrary]);

  // Initial load
  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  return {
    tracks,
    loading,
    refreshing,
    refreshLibrary,
    importTracks,
    deleteTrack,
  };
}
