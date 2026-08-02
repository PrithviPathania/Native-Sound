// Native Sound — File Importer Service
// Uses expo-music-info-2 for ID3 tags and expo-audio for duration extraction.

import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { createAudioPlayer } from 'expo-audio';
import MusicInfo from 'expo-music-info-2';
import { insertTrack } from '../db/database';
import type { Track } from '../types/track';

/**
 * Asynchronously extracts duration in seconds from an audio file using expo-audio.
 * Listens for native playbackStatusUpdate resolution and cleans up temporary player.
 */
export function readAudioDurationAsync(fileUri: string): Promise<number> {
  return new Promise((resolve) => {
    let resolved = false;
    let tempPlayer: ReturnType<typeof createAudioPlayer> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (tempPlayer) {
        try {
          if (typeof tempPlayer.remove === 'function') {
            tempPlayer.remove();
          }
        } catch (e) {
          console.warn('[Importer] Error releasing tempPlayer:', e);
        }
        tempPlayer = null;
      }
    };

    const finish = (durSeconds: number) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const validSecs = !durSeconds || isNaN(durSeconds) || durSeconds <= 0 ? 0 : Math.round(durSeconds);
      resolve(validSecs);
    };

    // Timeout safety fallback after 1.5s
    timeoutId = setTimeout(() => {
      finish(0);
    }, 1500);

    try {
      tempPlayer = createAudioPlayer({ uri: fileUri });

      // If duration is populated synchronously
      if (tempPlayer.duration && tempPlayer.duration > 0 && !isNaN(tempPlayer.duration)) {
        finish(tempPlayer.duration);
        return;
      }

      // Listen for async status updates when native audio loader resolves duration
      const sub = tempPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.duration && status.duration > 0 && !isNaN(status.duration)) {
          try {
            sub.remove();
          } catch {}
          finish(status.duration);
        }
      });
    } catch (err) {
      console.warn('[Importer] Error initializing tempPlayer:', err);
      finish(0);
    }
  });
}

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
    const sourceUri = asset.uri;
    const originalName = asset.name || `track_${Date.now()}_${i}.mp3`;

    const safeName = `${Date.now()}_${i}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destFile = new File(songsDir, safeName);

    try {
      // Step 3 — Read source audio file as base64 and write to persistent storage
      const sourceFile = new File(sourceUri);
      const base64Audio = await sourceFile.base64();
      await destFile.write(base64Audio, { encoding: 'base64' });

      // Metadata defaults from filename
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '').trim();
      let title = nameWithoutExt || 'Unknown Title';
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';
      let duration: number | undefined;
      let artworkUri: string | undefined;

      // Parse "Artist - Title" filename format if present as default
      if (nameWithoutExt.includes(' - ')) {
        const parts = nameWithoutExt.split(' - ');
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }
      }

      // Step 4 — Extract ID3 metadata using expo-music-info-2
      try {
        const metadata = await MusicInfo.getMusicInfoAsync(destFile.uri, {
          title: true,
          artist: true,
          album: true,
          picture: true,
        });

        if (metadata) {
          if (metadata.title?.trim()) title = metadata.title.trim();
          if (metadata.artist?.trim()) artist = metadata.artist.trim();
          if (metadata.album?.trim()) album = metadata.album.trim();

          if (metadata.picture?.pictureData) {
            try {
              const rawPic = metadata.picture.pictureData;
              const base64Clean = rawPic.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
              let ext = 'jpg';
              if (rawPic.includes('image/png')) ext = 'png';

              const artFile = new File(artworksDir, `art_${Date.now()}_${i}.${ext}`);
              await artFile.write(base64Clean, { encoding: 'base64' });
              artworkUri = artFile.uri;
            } catch (artErr) {
              console.warn('[Importer] Failed saving artwork picture:', artErr);
              artworkUri = metadata.picture.pictureData;
            }
          }
        }
      } catch (metaErr) {
        console.warn(`[Importer] MusicInfo metadata extraction failed for ${originalName}:`, metaErr);
      }

      // Step 5 — Extract duration asynchronously via expo-audio player
      duration = await readAudioDurationAsync(destFile.uri);
      const durationInSeconds = !duration || isNaN(duration) || duration <= 0 ? 0 : Math.round(duration);

      // Step 6 — Save track record to SQLite database
      const newTrack = await insertTrack({
        title,
        artist,
        album,
        fileUri: destFile.uri,
        duration: durationInSeconds,
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