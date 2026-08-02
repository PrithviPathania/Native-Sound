// Native Sound — File Importer Service
// Fully migrated to the modern expo-file-system API (File / Directory classes).

import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import MusicInfo from 'expo-music-info-2';
import { insertTrack } from '../db/database';
import type { Track } from '../types/track';

export async function importAudioFiles(): Promise<Track[]> {
  // Step 1 — Open document picker (do NOT copy to cache)
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/flac'],
    copyToCacheDirectory: false,
    multiple: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return [];
  }

  // Step 2 — Ensure persistent directories using modern Directory API
  const songsDir = new Directory(Paths.document, 'songs');
  const artworksDir = new Directory(Paths.document, 'artworks');

  if (!(await songsDir.exists)) {
    await songsDir.create();
  }
  if (!(await artworksDir.exists)) {
    await artworksDir.create();
  }

  const importedTracks: Track[] = [];

  for (let i = 0; i < result.assets.length; i++) {
    const asset = result.assets[i];
    const sourceUri = asset.uri;          // content:// URI
    const originalName = asset.name || `track_${Date.now()}_${i}.mp3`;

    const safeName = `${Date.now()}_${i}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destFile = new File(songsDir, safeName);

    try {
      // Step 3 — Read the file directly from the content URI using the modern File class
      const sourceFile = new File(sourceUri);
      const base64Audio = await sourceFile.base64();

      // Step 4 — Write to persistent storage as base64
      await destFile.write(base64Audio, { encoding: 'base64' });

      // Metadata defaults
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '').trim();
      let title = nameWithoutExt || 'Unknown Title';
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';
      let duration: number | undefined;
      let artworkUri: string | undefined;

      // Step 5 — Extract metadata from the saved file (now a regular file URI)
      try {
        // expo-music-info-2 expects a URI, so use the new file's .uri property
        const metadata = await MusicInfo.getMusicInfoAsync(destFile.uri, {
          title: true,
          artist: true,
          album: true,
          duration: true,
          picture: true,
        });

        if (metadata) {
          if (metadata.title?.trim()) title = metadata.title.trim();
          if (metadata.artist?.trim()) artist = metadata.artist.trim();
          if (metadata.album?.trim()) album = metadata.album.trim();
          if (metadata.duration && !isNaN(metadata.duration)) {
            duration = metadata.duration > 10000
              ? Math.round(metadata.duration / 1000)
              : Math.round(metadata.duration);
          }

          if (metadata.picture?.pictureData) {
            try {
              const artFile = new File(artworksDir, `art_${Date.now()}_${i}.jpg`);
              await artFile.write(metadata.picture.pictureData, { encoding: 'base64' });
              artworkUri = artFile.uri;
            } catch (artErr) {
              console.warn('[Importer] Failed to save artwork:', artErr);
            }
          }
        }
      } catch (metaErr) {
        console.warn(`[Importer] Metadata extraction failed for ${originalName}:`, metaErr);
      }

      // Step 6 — Insert into database
      const newTrack = await insertTrack({
        title,
        artist,
        album,
        fileUri: destFile.uri,
        duration,
        artworkUri,
      });

      importedTracks.push(newTrack);
    } catch (importErr) {
      console.error(`[Importer] Failed importing file ${originalName}:`, importErr);
    }
  }

  return importedTracks;
}

export async function importAudioFile(): Promise<Track | null> {
  const tracks = await importAudioFiles();
  return tracks.length > 0 ? tracks[0] : null;
}