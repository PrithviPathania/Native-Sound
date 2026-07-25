// Native Sound — File Importer Service
// Orchestrates: document picker → file copy → database insert.

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { insertTrack } from './database';
import type { Track } from '../types/track';

// ---------------------------------------------------------------------------
// importAudioFile
// ---------------------------------------------------------------------------
// 1. Opens the native file picker, filtered to audio/* types.
// 2. Copies the selected file into permanent app storage (documentDirectory).
// 3. Derives a clean title from the filename.
// 4. Saves the track metadata to SQLite and returns the new Track object.
// Returns null if the user cancelled the picker.
export async function importAudioFile(): Promise<Track | null> {
  // Step 1 — Open the system document picker
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',      // Accept any audio MIME type (mp3, m4a, flac …)
    copyToCacheDirectory: true,  // Required so expo-file-system can read the URI
    multiple: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null; // User cancelled
  }

  const asset = result.assets[0];
  const sourceUri = asset.uri;
  const originalName = asset.name; // e.g. "My Song - Artist.mp3"

  // Step 2 — Copy to permanent documentDirectory
  const destDir = FileSystem.documentDirectory + 'tracks/';

  // Ensure the destination directory exists
  const dirInfo = await FileSystem.getInfoAsync(destDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  }

  // Build a safe filename using a timestamp to avoid collisions
  const safeFilename = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const destUri = destDir + safeFilename;

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  // Step 3 — Derive a clean title from the filename (strip extension)
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  const title = nameWithoutExtension.trim() || 'Unknown Title';

  // Step 4 — Insert into SQLite and return the new Track
  const track = await insertTrack(title, 'Unknown Artist', destUri);
  return track;
}
