/**
 * MiniPlayer Tests
 *
 * Tests the MiniPlayer component, which is the small bar that appears
 * at the bottom of every screen when a song is playing.
 *
 * It should be visible on all normal screens (/, /import, /liked, etc.)
 * and hidden on /player (because the full player is already open).
 *
 * TrackLoader is a tiny helper that calls playTrack() inside the provider,
 * simulating the user having started a song before navigating to a screen.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import MiniPlayer from '../components/MiniPlayer';
import { AudioProvider, useAudio } from '../context/AudioContext';
import { insertTrack } from '../db/database';
import { resetInMemoryDb, setMockPathname } from './setup';

// Helper: puts a track into the AudioContext so MiniPlayer has something to show
function TrackLoader({ track }: { track: any }) {
  const { playTrack } = useAudio();
  React.useEffect(() => {
    playTrack(track);
  }, [track, playTrack]);
  return null;
}

describe('MiniPlayer', () => {
  // Before each test: wipe the fake database and reset all fake functions
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
  });

  it('shows when a track is playing on a normal screen', async () => {
    // Simulate being on the home screen
    setMockPathname('/');

    // Create a track and render MiniPlayer with it playing
    const track = await insertTrack({
      title: 'Active Song',
      artist: 'Active Artist',
      fileUri: 'file:///songs/active.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={track} />  {/* starts the track playing */}
          <MiniPlayer />
        </AudioProvider>
      );
    });

    // MiniPlayer should be visible showing the track info
    expect(screen.getByText('Active Song')).toBeDefined();
    expect(screen.getByText('Active Artist')).toBeDefined();
  });

  it('hides on the player screen', async () => {
    // Simulate being on the full player screen — MiniPlayer should disappear here
    setMockPathname('/player');

    const track = await insertTrack({
      title: 'Active Song',
      artist: 'Active Artist',
      fileUri: 'file:///songs/active.mp3',
    });

    let container: HTMLElement | null = null;
    await act(async () => {
      const result = render(
        <AudioProvider>
          <TrackLoader track={track} />
          <MiniPlayer />
        </AudioProvider>
      );
      // firstChild is null when MiniPlayer renders nothing (returns null)
      container = result.container.firstChild as HTMLElement | null;
    });

    // MiniPlayer should have rendered nothing at all
    expect(container).toBeNull();
  });
});
