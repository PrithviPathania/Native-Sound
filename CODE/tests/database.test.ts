/**
 * Database Tests
 *
 * Tests the liked songs feature at the database level — specifically
 * toggleLikeTrack() and getLikedTracks() in db/database.ts.
 *
 * The real functions run as-is against the fake in-memory database
 * from setup.ts (a plain JS array pretending to be SQLite).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { insertTrack, getLikedTracks, toggleLikeTrack } from '../db/database';
import { resetInMemoryDb } from './setup';

describe('Database', () => {
  // Before each test: wipe the fake database so tests don't share data
  beforeEach(() => {
    resetInMemoryDb();
  });

  it('liking a song saves it, unliking removes it', async () => {
    // Add a track to the fake database (like the app does after importing)
    const track = await insertTrack({
      title: 'Test Song',
      artist: 'Test Artist',
      fileUri: 'file:///songs/test.mp3',
    });

    // Like the song — toggle returns true meaning it is now liked
    const liked = await toggleLikeTrack(track.id);
    expect(liked).toBe(true);

    // The liked songs list should now have exactly this one track
    const likedTracks = await getLikedTracks();
    expect(likedTracks.length).toBe(1);
    expect(likedTracks[0].id).toBe(track.id);

    // Unlike the song — toggle returns false meaning it is no longer liked
    const unliked = await toggleLikeTrack(track.id);
    expect(unliked).toBe(false);

    // The liked songs list should be empty again
    const afterUnlike = await getLikedTracks();
    expect(afterUnlike.length).toBe(0);
  });
});
