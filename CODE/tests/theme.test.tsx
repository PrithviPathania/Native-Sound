import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DefaultTheme, BWTheme } from '../constants/theme';
import { getSetting, setSetting } from '../db/database';
import { resetInMemoryDb } from './setup';
import LibraryScreen from '../app/(tabs)/index';
import { AudioProvider } from '../context/AudioContext';

function ThemeConsumerTestComponent() {
  const { themeMode, colors, fonts, isBW, toggleTheme, setThemeMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{themeMode}</span>
      <span data-testid="font">{fonts.family}</span>
      <span data-testid="font-bold">{fonts.familyBold}</span>
      <span data-testid="primary-color">{colors.primary}</span>
      <span data-testid="danger-color">{colors.danger}</span>
      <span data-testid="is-bw">{isBW ? 'yes' : 'no'}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-bw-btn" onClick={() => setThemeMode('bw')}>
        Set BW
      </button>
    </div>
  );
}

describe('Theme System & BW Theme', () => {
  beforeEach(() => {
    resetInMemoryDb();
    vi.clearAllMocks();
  });

  describe('Theme Definitions', () => {
    it('defines DefaultTheme with Inter fonts and standard colors', () => {
      expect(DefaultTheme.fonts.family).toBe('Inter');
      expect(DefaultTheme.fonts.familyBold).toBe('Inter-Bold');
      expect(DefaultTheme.colors.primary).toBe('#0d6efd');
      expect(DefaultTheme.colors.danger).toBe('#dc3545');
    });

    it('defines BWTheme with "A Box For" font and pure white monochrome accents', () => {
      expect(BWTheme.fonts.family).toBe('A Box For');
      expect(BWTheme.fonts.familyBold).toBe('A Box For');
      expect(BWTheme.colors.primary).toBe('#ffffff');
      expect(BWTheme.colors.danger).toBe('#ffffff');
      expect(BWTheme.colors.textPrimary).toBe('#ffffff');
      expect(BWTheme.colors.iconColor).toBe('#ffffff');
    });
  });

  describe('Database Settings Key-Value Store', () => {
    it('stores and retrieves settings via SQLite', async () => {
      const initial = await getSetting('theme', 'default');
      expect(initial).toBe('default');

      await setSetting('theme', 'bw');
      const updated = await getSetting('theme', 'default');
      expect(updated).toBe('bw');
    });
  });

  describe('ThemeProvider & useTheme', () => {
    it('renders with default theme and toggles to BW theme', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ThemeConsumerTestComponent />
          </ThemeProvider>
        );
      });

      // Default initial state
      expect(screen.getByTestId('mode').textContent).toBe('default');
      expect(screen.getByTestId('font').textContent).toBe('Inter');
      expect(screen.getByTestId('primary-color').textContent).toBe('#0d6efd');
      expect(screen.getByTestId('is-bw').textContent).toBe('no');

      // Toggle to BW
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('mode').textContent).toBe('bw');
      expect(screen.getByTestId('font').textContent).toBe('A Box For');
      expect(screen.getByTestId('font-bold').textContent).toBe('A Box For');
      expect(screen.getByTestId('primary-color').textContent).toBe('#ffffff');
      expect(screen.getByTestId('danger-color').textContent).toBe('#ffffff');
      expect(screen.getByTestId('is-bw').textContent).toBe('yes');

      // Toggle back to default
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('mode').textContent).toBe('default');
      expect(screen.getByTestId('font').textContent).toBe('Inter');
      expect(screen.getByTestId('is-bw').textContent).toBe('no');
    });

    it('persists theme selection in database', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <ThemeConsumerTestComponent />
          </ThemeProvider>
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-bw-btn'));
      });

      const savedTheme = await getSetting('theme', 'default');
      expect(savedTheme).toBe('bw');
    });
  });

  describe('Library Screen Theme Toggle Pill', () => {
    it('renders the theme pill and toggles between COLOR and B&W', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <AudioProvider>
              <LibraryScreen />
            </AudioProvider>
          </ThemeProvider>
        );
      });

      const toggleButton = screen.getByLabelText(/Tap to switch theme/i);
      expect(toggleButton).toBeDefined();
      expect(screen.getByText('COLOR')).toBeDefined();

      // Click to toggle
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(screen.getByText('B&W')).toBeDefined();
    });
  });
});
