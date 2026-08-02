// Native Sound — SQLite Database Service (db/database.ts)
// Manages tracks schema and CRUD operations using expo-sqlite.

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import type { Track } from '../types/track';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('native_sound.db');
  }
  return db;
}

// ---------------------------------------------------------------------------
// Database Initialization & Migrations
// ---------------------------------------------------------------------------
export async function initDatabase(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tracks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title       TEXT    NOT NULL,
      artist      TEXT    NOT NULL DEFAULT 'Unknown Artist',
      album       TEXT    DEFAULT 'Unknown Album',
      file_uri    TEXT    NOT NULL UNIQUE,
      duration    REAL,
      artwork_uri TEXT,
      is_liked    INTEGER NOT NULL DEFAULT 0,
      date_added  TEXT    DEFAULT (datetime('now'))
    );
  `);

  // Run safe migrations if table pre-existed with older columns
  try {
    await database.execAsync(`ALTER TABLE tracks ADD COLUMN album TEXT DEFAULT 'Unknown Album';`);
  } catch {}
  try {
    await database.execAsync(`ALTER TABLE tracks ADD COLUMN artwork_uri TEXT;`);
  } catch {}
  try {
    await database.execAsync(`ALTER TABLE tracks ADD COLUMN date_added TEXT DEFAULT (datetime('now'));`);
  } catch {}
}

// ---------------------------------------------------------------------------
// Track Data Interface for insertion
// ---------------------------------------------------------------------------
export interface InsertTrackData {
  title: string;
  artist?: string;
  album?: string;
  fileUri: string;
  duration?: number;
  artworkUri?: string;
}

// ---------------------------------------------------------------------------
// insertTrack
// ---------------------------------------------------------------------------
export async function insertTrack(data: InsertTrackData): Promise<Track> {
  const database = await getDb();
  const title = data.title || 'Unknown Title';
  const artist = data.artist || 'Unknown Artist';
  const album = data.album || 'Unknown Album';
  const fileUri = data.fileUri;
  const duration = data.duration ?? null;
  const artworkUri = data.artworkUri ?? null;
  const dateAdded = new Date().toISOString();

  const result = await database.runAsync(
    `INSERT INTO tracks (title, artist, album, file_uri, duration, artwork_uri, is_liked, date_added)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    title,
    artist,
    album,
    fileUri,
    duration,
    artworkUri,
    dateAdded
  );

  const newId = result.lastInsertRowId;
  return {
    id: newId,
    uri: fileUri,
    fileUri,
    title,
    artist,
    album,
    duration: duration ?? undefined,
    artworkUri: artworkUri ?? undefined,
    liked: false,
    isLiked: false,
    dateAdded,
  };
}

// ---------------------------------------------------------------------------
// getAllTracks
// ---------------------------------------------------------------------------
export async function getAllTracks(): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    title: string;
    artist: string;
    album: string | null;
    file_uri: string;
    duration: number | null;
    artwork_uri: string | null;
    is_liked: number;
    date_added: string | null;
  }>('SELECT * FROM tracks ORDER BY id DESC');

  return rows.map((row) => ({
    id: row.id,
    uri: row.file_uri,
    fileUri: row.file_uri,
    title: row.title,
    artist: row.artist,
    album: row.album ?? 'Unknown Album',
    duration: row.duration ?? undefined,
    artworkUri: row.artwork_uri ?? undefined,
    liked: row.is_liked === 1,
    isLiked: row.is_liked === 1,
    dateAdded: row.date_added ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// getLikedTracks
// ---------------------------------------------------------------------------
export async function getLikedTracks(): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    title: string;
    artist: string;
    album: string | null;
    file_uri: string;
    duration: number | null;
    artwork_uri: string | null;
    is_liked: number;
    date_added: string | null;
  }>('SELECT * FROM tracks WHERE is_liked = 1 ORDER BY date_added DESC');

  return rows.map((row) => ({
    id: row.id,
    uri: row.file_uri,
    fileUri: row.file_uri,
    title: row.title,
    artist: row.artist,
    album: row.album ?? 'Unknown Album',
    duration: row.duration ?? undefined,
    artworkUri: row.artwork_uri ?? undefined,
    liked: true,
    isLiked: true,
    dateAdded: row.date_added ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// toggleLikeTrack
// ---------------------------------------------------------------------------
export async function toggleLikeTrack(id: number): Promise<boolean> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ is_liked: number }>(
    'SELECT is_liked FROM tracks WHERE id = ?',
    id
  );
  if (!row) throw new Error(`Track with id ${id} not found`);

  const newValue = row.is_liked === 1 ? 0 : 1;
  await database.runAsync('UPDATE tracks SET is_liked = ? WHERE id = ?', newValue, id);
  return newValue === 1;
}

// ---------------------------------------------------------------------------
// deleteTrack
// ---------------------------------------------------------------------------
export async function deleteTrack(id: number): Promise<void> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ file_uri: string; artwork_uri: string | null }>(
    'SELECT file_uri, artwork_uri FROM tracks WHERE id = ?',
    id
  );

  if (row) {
    // Delete local audio file
    if (row.file_uri) {
      try {
        await FileSystem.deleteAsync(row.file_uri, { idempotent: true });
      } catch (err) {
        console.warn(`[DB] Failed to delete audio file: ${row.file_uri}`, err);
      }
    }
    // Delete artwork file if saved locally
    if (row.artwork_uri && row.artwork_uri.startsWith('file://')) {
      try {
        await FileSystem.deleteAsync(row.artwork_uri, { idempotent: true });
      } catch (err) {
        console.warn(`[DB] Failed to delete artwork file: ${row.artwork_uri}`, err);
      }
    }
  }

  await database.runAsync('DELETE FROM tracks WHERE id = ?', id);
}
