/**
 * File Importer Tests
 *
 * Tests the importAudioFiles() function, which is what runs when a user
 * taps "Import" to add mp3s from their phone into Native Sound.
 *
 * The real function runs as-is. The fake phone (setup.ts) handles
 * file copying, ID3 tag reading, and database saving silently.
 * This test only fakes the file picker to control which files come in.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importAudioFiles } from '../services/fileImporter';
import { resetInMemoryDb } from './setup';
import * as DocumentPicker from 'expo-document-picker';

describe('File Importer', () => {
  // Before each test: wipe the fake database and reset all fake functions
  // so no leftover data bleeds between tests
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
  });

  it('imports multiple mp3 files and saves them to the database', async () => {
    // Fake the file picker to return 2 specific mp3s, as if the user picked them
    vi.spyOn(DocumentPicker, 'getDocumentAsync').mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file:///picker/song1.mp3', name: 'Artist One - Track One.mp3', mimeType: 'audio/mpeg', size: 1024 },
        { uri: 'file:///picker/song2.mp3', name: 'Artist Two - Track Two.mp3', mimeType: 'audio/mpeg', size: 2048 },
      ],
    } as any);

    // Run the real import function
    const tracks = await importAudioFiles();

    // Both files should have been imported and saved as tracks
    expect(tracks.length).toBe(2);

    // Each track should have a title and a file path (not empty)
    expect(tracks[0].title).toBeTruthy();
    expect(tracks[0].fileUri).toBeTruthy();
    expect(tracks[1].title).toBeTruthy();
    expect(tracks[1].fileUri).toBeTruthy();
  });
});
