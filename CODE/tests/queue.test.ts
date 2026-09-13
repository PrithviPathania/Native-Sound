import { describe, it, expect } from 'vitest';
import { getUpcomingQueue } from '../context/AudioContext';
import type { Track } from '../types/track';

const createTrack = (id: number, title: string): Track => ({
  id,
  title,
  artist: 'Artist',
  uri: `file:///song_${id}.mp3`,
  liked: false,
});

describe('getUpcomingQueue', () => {
  const t1 = createTrack(1, 'Track 1');
  const t2 = createTrack(2, 'Track 2');
  const t3 = createTrack(3, 'Track 3');
  const t4 = createTrack(4, 'Track 4');
  const tracks = [t1, t2, t3, t4];

  describe('Sequential playback (isShuffled = false)', () => {
    it('returns remaining tracks when repeat is off', () => {
      const queue = getUpcomingQueue({
        currentTrack: t2,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'off',
      });
      expect(queue.map((t) => t.id)).toEqual([3, 4]);
    });

    it('returns empty array when current track is the last track and repeat is off', () => {
      const queue = getUpcomingQueue({
        currentTrack: t4,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'off',
      });
      expect(queue).toEqual([]);
    });

    it('returns remaining tracks followed by preceding tracks when repeat is all', () => {
      const queue = getUpcomingQueue({
        currentTrack: t2,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'all',
      });
      expect(queue.map((t) => t.id)).toEqual([3, 4, 1]);
    });

    it('returns all preceding tracks in order when current track is last and repeat is all', () => {
      const queue = getUpcomingQueue({
        currentTrack: t4,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'all',
      });
      expect(queue.map((t) => t.id)).toEqual([1, 2, 3]);
    });

    it('returns current track repeating first when repeat is one', () => {
      const queue = getUpcomingQueue({
        currentTrack: t2,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'one',
      });
      expect(queue.map((t) => t.id)).toEqual([2, 3, 4]);
    });
  });

  describe('Shuffled playback (isShuffled = true)', () => {
    const shuffleQueue = [t3, t1, t4, t2];

    it('follows shuffled order after current track when repeat is off', () => {
      const queue = getUpcomingQueue({
        currentTrack: t1,
        tracks,
        isShuffled: true,
        shuffleQueue,
        repeatMode: 'off',
      });
      expect(queue.map((t) => t.id)).toEqual([4, 2]);
    });

    it('loops back to beginning of shuffle queue when repeat is all', () => {
      const queue = getUpcomingQueue({
        currentTrack: t1,
        tracks,
        isShuffled: true,
        shuffleQueue,
        repeatMode: 'all',
      });
      expect(queue.map((t) => t.id)).toEqual([4, 2, 3]);
    });

    it('returns empty array if at the end of shuffle queue with repeat off', () => {
      const queue = getUpcomingQueue({
        currentTrack: t2,
        tracks,
        isShuffled: true,
        shuffleQueue,
        repeatMode: 'off',
      });
      expect(queue).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('returns empty array when currentTrack is null', () => {
      const queue = getUpcomingQueue({
        currentTrack: null,
        tracks,
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'off',
      });
      expect(queue).toEqual([]);
    });

    it('returns empty array when tracks list is empty', () => {
      const queue = getUpcomingQueue({
        currentTrack: t1,
        tracks: [],
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'off',
      });
      expect(queue).toEqual([]);
    });

    it('handles single track with repeat off', () => {
      const queue = getUpcomingQueue({
        currentTrack: t1,
        tracks: [t1],
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'off',
      });
      expect(queue).toEqual([]);
    });

    it('handles single track with repeat one', () => {
      const queue = getUpcomingQueue({
        currentTrack: t1,
        tracks: [t1],
        isShuffled: false,
        shuffleQueue: [],
        repeatMode: 'one',
      });
      expect(queue.map((t) => t.id)).toEqual([1]);
    });
  });
});
