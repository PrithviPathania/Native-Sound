/**
 * AudioContext Tests
 *
 * Tests that AudioContext shares audio playback state across all screens.
 * In Native Sound, one AudioProvider wraps the whole app so every screen
 * (library, liked, search, settings, player) sees the same playing track.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AudioProvider, useAudio } from '../context/AudioContext';
import { insertTrack } from '../db/database';
import { resetInMemoryDb } from './setup';

// Fake "Screen A" — any screen in the app that can start playback (e.g. Library)
function ScreenA({ track }: { track: any }) {
  const { playTrack, toggleRepeat, toggleShuffle } = useAudio();
  return (
    <div>
      <button onClick={() => playTrack(track)}>play</button>
      <button onClick={() => toggleRepeat()}>toggle-repeat</button>
      <button onClick={() => toggleShuffle()}>toggle-shuffle</button>
    </div>
  );
}

// Fake "Screen B" — any other screen that reads the current track & queue
function ScreenB() {
  const { currentTrack, queue, repeatMode, isShuffled } = useAudio();
  return (
    <div>
      <span data-testid="current-title">{currentTrack ? currentTrack.title : 'nothing playing'}</span>
      <span data-testid="queue-count">{queue.length}</span>
      <span data-testid="queue-first">{queue[0]?.title ?? 'empty'}</span>
      <span data-testid="repeat-mode">{repeatMode}</span>
      <span data-testid="is-shuffled">{isShuffled ? 'shuffled' : 'normal'}</span>
    </div>
  );
}

describe('AudioContext across screens', () => {
  // Before each test: wipe the fake database and reset all fake functions
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
  });

  it('shares audio playback state across all screens', async () => {
    // Create a track in the fake database, like it exists in the user's library
    const track = await insertTrack({
      title: 'My Song',
      artist: 'Artist',
      fileUri: 'file:///songs/my.mp3',
    });

    // Render both screens wrapped in one shared AudioProvider (same as the real app)
    await act(async () => {
      render(
        <AudioProvider>
          <ScreenA track={track} />
          <ScreenB />
        </AudioProvider>
      );
    });

    // Before anything is played, Screen B should show nothing
    expect(screen.getByText('nothing playing')).toBeDefined();

    // Screen A starts playback (user taps play)
    await act(async () => {
      screen.getByText('play').click();
    });

    // Screen B now shows the same track — proving context is shared across screens
    expect(screen.getByText('My Song')).toBeDefined();
  });

  it('updates the queue and playback modes reactively', async () => {
    const t1 = await insertTrack({
      title: 'Track 1',
      artist: 'Artist 1',
      fileUri: 'file:///songs/t1.mp3',
    });
    const t2 = await insertTrack({
      title: 'Track 2',
      artist: 'Artist 2',
      fileUri: 'file:///songs/t2.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <ScreenA track={t1} />
          <ScreenB />
        </AudioProvider>
      );
    });

    // Start playing t1
    await act(async () => {
      screen.getByText('play').click();
    });

    expect(screen.getByTestId('current-title').textContent).toBe('Track 1');

    // Toggle repeat mode (off -> all)
    await act(async () => {
      screen.getByText('toggle-repeat').click();
    });
    expect(screen.getByTestId('repeat-mode').textContent).toBe('all');

    // Toggle shuffle mode (normal -> shuffled)
    await act(async () => {
      screen.getByText('toggle-shuffle').click();
    });
    expect(screen.getByTestId('is-shuffled').textContent).toBe('shuffled');
  });

  it('reorders the upcoming queue and advances playback in the reordered sequence', async () => {
    const t1 = await insertTrack({
      title: 'Track 1',
      artist: 'Artist 1',
      fileUri: 'file:///songs/t1.mp3',
    });
    const t2 = await insertTrack({
      title: 'Track 2',
      artist: 'Artist 2',
      fileUri: 'file:///songs/t2.mp3',
    });
    const t3 = await insertTrack({
      title: 'Track 3',
      artist: 'Artist 3',
      fileUri: 'file:///songs/t3.mp3',
    });

    function ReorderController() {
      const { reorderQueue, playNext, queue } = useAudio();
      return (
        <div>
          <button onClick={() => reorderQueue(0, 1)}>reorder-first-two</button>
          <button onClick={() => playNext()}>play-next</button>
          <span data-testid="queue-order">{queue.map((t) => t.title).join(',')}</span>
        </div>
      );
    }

    await act(async () => {
      render(
        <AudioProvider>
          <ScreenA track={t1} />
          <ScreenB />
          <ReorderController />
        </AudioProvider>
      );
    });

    // Start playing Track 1
    await act(async () => {
      screen.getByText('play').click();
    });

    expect(screen.getByTestId('current-title').textContent).toBe('Track 1');
    expect(screen.getByTestId('queue-order').textContent).toBe('Track 2,Track 3');

    // Reorder upcoming queue: swap Track 2 and Track 3
    await act(async () => {
      screen.getByText('reorder-first-two').click();
    });

    // Verify queue order changed to Track 3, Track 2
    expect(screen.getByTestId('queue-order').textContent).toBe('Track 3,Track 2');

    // Call playNext() -> should advance to Track 3, not Track 2!
    await act(async () => {
      screen.getByText('play-next').click();
    });

    expect(screen.getByTestId('current-title').textContent).toBe('Track 3');
    expect(screen.getByTestId('queue-order').textContent).toBe('Track 2');
  });

  it('removes a track from the upcoming queue via removeFromQueue', async () => {
    const t1 = await insertTrack({
      title: 'Track 1',
      artist: 'Artist 1',
      fileUri: 'file:///songs/t1.mp3',
    });
    const t2 = await insertTrack({
      title: 'Track 2',
      artist: 'Artist 2',
      fileUri: 'file:///songs/t2.mp3',
    });
    const t3 = await insertTrack({
      title: 'Track 3',
      artist: 'Artist 3',
      fileUri: 'file:///songs/t3.mp3',
    });

    function RemoveQueueController() {
      const { removeFromQueue, queue } = useAudio();
      return (
        <div>
          <button onClick={() => removeFromQueue(0)}>remove-first-queue-item</button>
          <span data-testid="queue-order-remove">{queue.map((t) => t.title).join(',')}</span>
        </div>
      );
    }

    await act(async () => {
      render(
        <AudioProvider>
          <ScreenA track={t1} />
          <ScreenB />
          <RemoveQueueController />
        </AudioProvider>
      );
    });

    // Start playing Track 1
    await act(async () => {
      screen.getByText('play').click();
    });

    expect(screen.getByTestId('queue-order-remove').textContent).toBe('Track 2,Track 3');

    // Remove first item in upcoming queue (Track 2)
    await act(async () => {
      screen.getByText('remove-first-queue-item').click();
    });

    // Now upcoming queue should only have Track 3
    expect(screen.getByTestId('queue-order-remove').textContent).toBe('Track 3');
  });
});

