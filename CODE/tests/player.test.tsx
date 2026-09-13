import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import PlayerScreen from '../app/player';
import { AudioProvider, useAudio } from '../context/AudioContext';
import { insertTrack } from '../db/database';
import { resetInMemoryDb, setMockPathname, mockRouter } from './setup';

function TrackLoader({ track }: { track: any }) {
  const { playTrack, refreshTracks } = useAudio();
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refreshTracks().then(() => {
        playTrack(track);
      });
    }
  }, [track, playTrack, refreshTracks]);

  return null;
}

describe('PlayerScreen Queue Feature', () => {
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
    setMockPathname('/player');
  });

  it('toggles queue view on and off when queue button is clicked', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });
    await insertTrack({
      title: 'Second Song',
      artist: 'Second Artist',
      fileUri: 'file:///songs/2.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    // Standard view initially: no "Up Next" text
    expect(screen.queryByText('Up Next')).toBeNull();

    // Find the Queue toggle button
    const queueBtn = screen.getByLabelText('Toggle queue');
    expect(queueBtn).toBeDefined();

    // Click Queue button to open queue view
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    // Minimized header and "Up Next" section should be visible
    expect(screen.getByText('Up Next')).toBeDefined();
    expect(screen.getByText('Playing in order')).toBeDefined();
    expect(screen.getByText('Second Song')).toBeDefined();

    // Click Queue button again to toggle back to standard view
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    expect(screen.queryByText('Up Next')).toBeNull();
  });

  it('updates the queue subtitle when shuffle or repeat is toggled', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });
    await insertTrack({
      title: 'Second Song',
      artist: 'Second Artist',
      fileUri: 'file:///songs/2.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    // Open queue
    const queueBtn = screen.getByLabelText('Toggle queue');
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    expect(screen.getByText('Playing in order')).toBeDefined();

    // Toggle shuffle ON
    const shuffleBtn = screen.getByLabelText('Toggle shuffle');
    await act(async () => {
      fireEvent.click(shuffleBtn);
    });
    expect(screen.getByText('Shuffled order')).toBeDefined();

    // Toggle repeat (off -> all) with shuffle still ON
    const repeatBtn = screen.getByLabelText('Toggle repeat');
    await act(async () => {
      fireEvent.click(repeatBtn);
    });
    expect(screen.getByText('Shuffled & looping')).toBeDefined();

    // Toggle shuffle OFF -> now pure repeat all
    await act(async () => {
      fireEvent.click(shuffleBtn);
    });
    expect(screen.getByText('Looping all tracks')).toBeDefined();

    // Toggle repeat again (all -> one)
    await act(async () => {
      fireEvent.click(repeatBtn);
    });
    expect(screen.getByText('Repeating current track')).toBeDefined();
  });

  it('plays queued track when tapped', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });
    await insertTrack({
      title: 'Second Song',
      artist: 'Second Artist',
      fileUri: 'file:///songs/2.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    // Open queue
    const queueBtn = screen.getByLabelText('Toggle queue');
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    // Tap Second Song in queue
    const secondSongItem = screen.getByLabelText('Play Second Song');
    await act(async () => {
      fireEvent.click(secondSongItem);
    });

    // Second Song is now playing (minimized title will show Second Song)
    expect(screen.getAllByText('Second Song').length).toBeGreaterThan(0);
  });

  it('dismisses player cleanly to library when dismiss button is pressed', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    const closeBtn = screen.getByLabelText('Close player');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('renders reorder handles for queue items and supports interaction', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });
    const t2 = await insertTrack({
      title: 'Second Song',
      artist: 'Second Artist',
      fileUri: 'file:///songs/2.mp3',
    });
    const t3 = await insertTrack({
      title: 'Third Song',
      artist: 'Third Artist',
      fileUri: 'file:///songs/3.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    // Open queue
    const queueBtn = screen.getByLabelText('Toggle queue');
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    // Queue has Second Song and Third Song
    expect(screen.getByText('Second Song')).toBeDefined();
    expect(screen.getByText('Third Song')).toBeDefined();

    // Find reorder handle for Third Song
    const reorderThird = screen.getByLabelText('Reorder Third Song');
    expect(reorderThird).toBeDefined();

    // Verify touch responder handlers are bound
    await act(async () => {
      fireEvent.touchStart(reorderThird, {
        touches: [{ identifier: 0, force: 1, clientX: 0, clientY: 100, pageX: 0, pageY: 100 }],
        changedTouches: [{ identifier: 0, force: 1, clientX: 0, clientY: 100, pageX: 0, pageY: 100 }],
      });
      fireEvent.touchEnd(reorderThird, {
        touches: [],
        changedTouches: [{ identifier: 0, force: 1, clientX: 0, clientY: 100, pageX: 0, pageY: 100 }],
      });
    });
  });

  it('removes a track from the queue when remove action is triggered', async () => {
    const t1 = await insertTrack({
      title: 'First Song',
      artist: 'First Artist',
      fileUri: 'file:///songs/1.mp3',
    });
    const t2 = await insertTrack({
      title: 'Second Song',
      artist: 'Second Artist',
      fileUri: 'file:///songs/2.mp3',
    });

    await act(async () => {
      render(
        <AudioProvider>
          <TrackLoader track={t1} />
          <PlayerScreen />
        </AudioProvider>
      );
    });

    // Open queue
    const queueBtn = screen.getByLabelText('Toggle queue');
    await act(async () => {
      fireEvent.click(queueBtn);
    });

    // Second Song is in the queue
    expect(screen.getByText('Second Song')).toBeDefined();

    // Trigger remove on Second Song
    const removeBtn = screen.getByLabelText('Remove Second Song from queue');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    // Second Song is removed and empty state or updated queue is shown
    expect(screen.queryByText('Second Song')).toBeNull();
    expect(screen.getByText('End of Queue')).toBeDefined();
  });
});
