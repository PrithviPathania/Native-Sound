// Native Sound — SQLite Database Service
// All direct database access is centralised here.
// Uses expo-sqlite v57 async API.

import * as SQLite from 'expo-sqlite';
import type { Track } from '../types/track';

// Module-level singleton — opened once, reused everywhere.
let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('native_sound.db');
  }
  return db;
}

// ---------------------------------------------------------------------------
// initDatabase
// ---------------------------------------------------------------------------
// Creates the tracks table if it doesn't already exist.
// Call this once on app launch (in _layout.tsx useEffect).
export async function initDatabase(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tracks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title     TEXT    NOT NULL,
      artist    TEXT    NOT NULL DEFAULT 'Unknown Artist',
      file_uri  TEXT    NOT NULL UNIQUE,
      duration  REAL,
      is_liked  INTEGER NOT NULL DEFAULT 0
    );
  `);
}

// ---------------------------------------------------------------------------
// insertTrack
// ---------------------------------------------------------------------------
// Inserts a new track row and returns the full Track object with its new id.
export async function insertTrack(
  title: string,
  artist: string,
  fileUri: string,
  duration?: number
): Promise<Track> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO tracks (title, artist, file_uri, duration, is_liked) VALUES (?, ?, ?, ?, 0)',
    title,
    artist,
    fileUri,
    duration ?? null
  );
  return {
    id: result.lastInsertRowId,
    title,
    artist,
    fileUri,
    duration,
    isLiked: false,
  };
}

// ---------------------------------------------------------------------------
// getAllTracks
// ---------------------------------------------------------------------------
// Returns all tracks ordered by insertion (newest first).
export async function getAllTracks(): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    title: string;
    artist: string;
    file_uri: string;
    duration: number | null;
    is_liked: number;
  }>('SELECT * FROM tracks ORDER BY id DESC');

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    fileUri: row.file_uri,
    duration: row.duration ?? undefined,
    isLiked: row.is_liked === 1,
  }));
}

// ---------------------------------------------------------------------------
// toggleLikeTrack
// ---------------------------------------------------------------------------
// Flips the is_liked flag for a given track id.
// Returns the new liked state.
export async function toggleLikeTrack(id: number): Promise<boolean> {
  const database = await getDb();

  // Read current value
  const row = await database.getFirstAsync<{ is_liked: number }>(
    'SELECT is_liked FROM tracks WHERE id = ?',
    id
  );
  if (!row) throw new Error(`Track with id ${id} not found`);

  const newValue = row.is_liked === 1 ? 0 : 1;
  await database.runAsync('UPDATE tracks SET is_liked = ? WHERE id = ?', newValue, id);
  return newValue === 1;
}
