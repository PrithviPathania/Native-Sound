/**
 * AudioContext Tests
 *
 * Tests that AudioContext shares audio playback state across all screens.
 * In Native Sound, one AudioProvider wraps the whole app so every screen
 * (library, liked, search, settings, player) sees the same playing track.
 *
 * This test uses two minimal fake "screens" rendered under one provider
 * to prove that playing a track on one screen is visible on another.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AudioProvider, useAudio } from '../context/AudioContext';
import { insertTrack } from '../db/database';
import { resetInMemoryDb } from './setup';

// Fake "Screen A" — any screen in the app that can start playback (e.g. Library)
function ScreenA({ track }: { track: any }) {
  const { playTrack } = useAudio();
  return <button onClick={() => playTrack(track)}>play</button>;
}

// Fake "Screen B" — any other screen that reads the current track (e.g. Liked Songs)
function ScreenB() {
  const { currentTrack } = useAudio();
  return <span>{currentTrack ? currentTrack.title : 'nothing playing'}</span>;
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
});
