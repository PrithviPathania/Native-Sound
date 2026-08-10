/**
 * Test Setup
 *
 * This file fakes all the native modules (audio, database, files, router, etc.)
 * so our tests can run without a real phone or database.
 *
 * It runs automatically before every test file (configured in vitest.config.ts).
 *
 * Only two things are exported for tests to use:
 *   - resetInMemoryDb()  — clears the fake database between tests
 *   - setMockPathname()  — changes the current screen path for router tests
 */

import { vi } from 'vitest';
import React from 'react';

// ── Fake Audio Player ────────────────────────────────────────────────
// Pretends to be expo-audio. Tracks play/pause state and notifies listeners.

let isPlaying = false;
let playerCurrentTime = 0;
type StatusListener = (status: Record<string, unknown>) => void;
const listeners = new Set<StatusListener>();

function getStatus() {
  return { playing: isPlaying, currentTime: playerCurrentTime, duration: 180, didJustFinish: false, error: null };
}

function notifyListeners() {
  listeners.forEach((cb) => cb(getStatus()));
}

const fakePlayer = {
  volume: 1.0,
  duration: 180,
  play: vi.fn(() => {
    isPlaying = true;
    notifyListeners();
  }),
  pause: vi.fn(() => {
    isPlaying = false;
    notifyListeners();
  }),
  seekTo: vi.fn(async (seconds: number) => {
    playerCurrentTime = seconds;
    notifyListeners();
  }),
  replace: vi.fn(() => {
    playerCurrentTime = 0;
    isPlaying = false;
  }),
  addListener: vi.fn((_event: string, cb: StatusListener) => {
    listeners.add(cb);
    cb(getStatus()); // fire once immediately so the component gets initial state
    return { remove: vi.fn(() => listeners.delete(cb)) };
  }),
  remove: vi.fn(),
};

vi.mock('expo-audio', () => ({
  setAudioModeAsync: vi.fn(async () => {}),
  createAudioPlayer: vi.fn(() => fakePlayer),
}));

// ── Fake Database ────────────────────────────────────────────────────
// An in-memory array that pretends to be SQLite.
// Supports the same INSERT / UPDATE / DELETE / SELECT queries our app uses.

interface Row {
  id: number;
  title: string;
  artist: string;
  album: string;
  file_uri: string;
  duration: number | null;
  artwork_uri: string | null;
  is_liked: number;
  date_added: string;
}

const rows: Row[] = [];
let nextId = 1;

/** Clears all rows so each test starts with a fresh database. */
export function resetInMemoryDb() {
  rows.length = 0;
  nextId = 1;
}

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn(async () => ({
    // CREATE TABLE etc. — nothing to do in memory
    execAsync: vi.fn(async () => {}),

    // INSERT, UPDATE, DELETE
    runAsync: vi.fn(async (sql: string, ...params: any[]) => {
      if (sql.includes('INSERT INTO tracks')) {
        const [title, artist, album, fileUri, duration, artworkUri] = params;
        const row: Row = {
          id: nextId++,
          title: title || 'Unknown Title',
          artist: artist || 'Unknown Artist',
          album: album || 'Unknown Album',
          file_uri: fileUri,
          duration: duration ?? 0,
          artwork_uri: artworkUri ?? null,
          is_liked: 0,
          date_added: new Date().toISOString(),
        };
        rows.push(row);
        return { lastInsertRowId: row.id, changes: 1 };
      }
      if (sql.includes('UPDATE tracks SET is_liked')) {
        const [isLiked, id] = params;
        const found = rows.find((r) => r.id === id);
        if (found) found.is_liked = isLiked;
        return { changes: 1 };
      }
      if (sql.includes('UPDATE tracks SET duration')) {
        const [duration, id] = params;
        const found = rows.find((r) => r.id === id);
        if (found) found.duration = duration;
        return { changes: 1 };
      }
      if (sql.includes('DELETE FROM tracks')) {
        const [id] = params;
        const idx = rows.findIndex((r) => r.id === id);
        if (idx !== -1) rows.splice(idx, 1);
        return { changes: 1 };
      }
      return { changes: 0 };
    }),

    // SELECT queries
    getAllAsync: vi.fn(async (sql: string) => {
      if (sql.includes('WHERE is_liked = 1')) {
        return rows.filter((r) => r.is_liked === 1);
      }
      if (sql.includes('WHERE duration IS NULL OR duration <= 0')) {
        return rows.filter((r) => r.duration === null || r.duration <= 0);
      }
      return [...rows];
    }),

    getFirstAsync: vi.fn(async (_sql: string, ...params: any[]) => {
      return rows.find((r) => r.id === params[0]) || null;
    }),
  })),
}));

// ── Fake File System ─────────────────────────────────────────────────
// Pretends files exist and read/write operations succeed silently.

vi.mock('expo-file-system', () => ({
  Directory: vi.fn().mockImplementation((_parent: unknown, name: string) => ({
    uri: `file:///documents/${name}`,
    exists: Promise.resolve(true),
    create: vi.fn(async () => {}),
  })),
  File: vi.fn().mockImplementation((parentOrUri: string, name?: string) => ({
    uri: name ? `file:///documents/songs/${name}` : parentOrUri,
    base64: vi.fn(async () => 'fake_base64'),
    write: vi.fn(async () => {}),
  })),
  Paths: { document: 'file:///documents' },
}));

vi.mock('expo-file-system/legacy', () => ({
  deleteAsync: vi.fn(async () => {}),
}));

// ── Fake Music Metadata Reader ───────────────────────────────────────
// Returns fake ID3 tag data (title, artist, album, artwork) for any audio file.

vi.mock('expo-music-info-2', () => ({
  default: {
    getMusicInfoAsync: vi.fn(async () => ({
      title: 'Parsed Title',
      artist: 'Parsed Artist',
      album: 'Parsed Album',
      picture: { pictureData: 'data:image/jpeg;base64,fake' },
    })),
  },
}));

// ── Fake Router ──────────────────────────────────────────────────────
// Pretends to be expo-router. Tracks which screen we're on.

let currentPath = '/';

/** Changes the fake current screen path (e.g. '/' or '/player'). */
export function setMockPathname(path: string) {
  currentPath = path;
}

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => currentPath,
  useFocusEffect: (cb: () => void) => {
    React.useEffect(() => { cb(); }, [cb]);
  },
}));

// ── Fake Icons ───────────────────────────────────────────────────────
// Renders a plain <span> instead of a real vector icon.

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) =>
    React.createElement('span', { 'data-testid': `icon-${name}` }),
}));

// ── Fake Document Picker ─────────────────────────────────────────────
// Returns one dummy file when the picker opens (tests can override this with vi.spyOn).

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///picker/song1.mp3', name: 'Artist - Song.mp3' }],
  })),
}));

// ── Fake Styles ──────────────────────────────────────────────────────
// Returns an empty object for any style name so components render without crashing.

vi.mock('../styles/bootstrap', () => ({
  s: new Proxy({}, { get: () => ({}) }),
}));
