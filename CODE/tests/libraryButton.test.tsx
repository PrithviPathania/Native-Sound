import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LikedSongsPage from '../app/(tabs)/liked';
import ImportPage from '../app/(tabs)/import';
import { AudioProvider } from '../context/AudioContext';
import { mockRouter, resetInMemoryDb } from './setup';

describe('Library Navigation Box on Liked and Import screens', () => {
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
  });

  it('renders styled Library button on Liked Songs screen and navigates to library on press', async () => {
    await act(async () => {
      render(
        <AudioProvider>
          <LikedSongsPage />
        </AudioProvider>
      );
    });

    const libraryBtn = screen.getByLabelText('Back to Library');
    expect(libraryBtn).toBeDefined();
    expect(screen.getByText('Library')).toBeDefined();
    expect(screen.getByTestId('icon-chevron-back')).toBeDefined();

    // When clicked, triggers back (or navigation to library)
    fireEvent.click(libraryBtn);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('navigates with replace if canGoBack is false on Liked Songs screen', async () => {
    mockRouter.canGoBack.mockReturnValueOnce(false);

    await act(async () => {
      render(
        <AudioProvider>
          <LikedSongsPage />
        </AudioProvider>
      );
    });

    const libraryBtn = screen.getByLabelText('Back to Library');
    fireEvent.click(libraryBtn);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/(tabs)/');
  });

  it('renders styled Library button on Import screen and navigates to library on press', async () => {
    await act(async () => {
      render(<ImportPage />);
    });

    const libraryBtn = screen.getByLabelText('Back to Library');
    expect(libraryBtn).toBeDefined();
    expect(screen.getByText('Library')).toBeDefined();
    expect(screen.getByTestId('icon-chevron-back')).toBeDefined();

    fireEvent.click(libraryBtn);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
