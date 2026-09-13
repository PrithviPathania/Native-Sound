import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DefaultTheme, BWTheme, CustomTheme, THEME_OPTIONS } from '../constants/theme';
import { getSetting, setSetting } from '../db/database';
import { resetInMemoryDb } from './setup';
import LibraryScreen from '../app/(tabs)/index';
import { AudioProvider } from '../context/AudioContext';

function ThemeConsumerTestComponent() {
  const { themeMode, colors, fonts, isBW, isCustom, toggleTheme, setThemeMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{themeMode}</span>
      <span data-testid="font">{fonts.family}</span>
      <span data-testid="font-bold">{fonts.familyBold}</span>
      <span data-testid="primary-color">{colors.primary}</span>
      <span data-testid="danger-color">{colors.danger}</span>
      <span data-testid="is-bw">{isBW ? 'yes' : 'no'}</span>
      <span data-testid="is-custom">{isCustom ? 'yes' : 'no'}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-bw-btn" onClick={() => setThemeMode('bw')}>
        Set BW
      </button>
      <button data-testid="set-custom-btn" onClick={() => setThemeMode('custom')}>
        Set Custom
      </button>
    </div>
  );
}

describe('Theme System & Multi-Theme Architecture', () => {
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

    it('defines CustomTheme with "A Box For" font and custom theme options', () => {
      expect(CustomTheme.name).toBe('custom');
      expect(CustomTheme.fonts.family).toBe('A Box For');
      expect(THEME_OPTIONS).toHaveLength(3);
      expect(THEME_OPTIONS.map((t) => t.key)).toEqual(['default', 'bw', 'custom']);
    });
  });

  describe('Database Settings Key-Value Store', () => {
    it('stores and retrieves settings via SQLite', async () => {
      const initial = await getSetting('theme', 'default');
      expect(initial).toBe('default');

      await setSetting('theme', 'custom');
      const updated = await getSetting('theme', 'default');
      expect(updated).toBe('custom');
    });
  });

  describe('ThemeProvider & useTheme', () => {
    it('renders with default theme and cycles through BW and Custom themes', async () => {
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
      expect(screen.getByTestId('is-custom').textContent).toBe('no');

      // Cycle 1: default -> bw
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('mode').textContent).toBe('bw');
      expect(screen.getByTestId('font').textContent).toBe('A Box For');
      expect(screen.getByTestId('is-bw').textContent).toBe('yes');
      expect(screen.getByTestId('is-custom').textContent).toBe('no');

      // Cycle 2: bw -> custom
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('mode').textContent).toBe('custom');
      expect(screen.getByTestId('font').textContent).toBe('A Box For');
      expect(screen.getByTestId('is-bw').textContent).toBe('yes');
      expect(screen.getByTestId('is-custom').textContent).toBe('yes');

      // Cycle 3: custom -> default
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('mode').textContent).toBe('default');
      expect(screen.getByTestId('font').textContent).toBe('Inter');
      expect(screen.getByTestId('is-bw').textContent).toBe('no');
      expect(screen.getByTestId('is-custom').textContent).toBe('no');
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
        fireEvent.click(screen.getByTestId('set-custom-btn'));
      });

      const savedTheme = await getSetting('theme', 'default');
      expect(savedTheme).toBe('custom');
    });
  });

  describe('Library Screen Theme Dropdown', () => {
    it('renders the theme dropdown trigger and switches themes', async () => {
      await act(async () => {
        render(
          <ThemeProvider>
            <AudioProvider>
              <LibraryScreen />
            </AudioProvider>
          </ThemeProvider>
        );
      });

      const dropdownTrigger = screen.getByLabelText(/Tap to choose theme/i);
      expect(dropdownTrigger).toBeDefined();
      expect(screen.getByText('COLOR')).toBeDefined();

      // Tap trigger to open dropdown
      await act(async () => {
        fireEvent.click(dropdownTrigger);
      });

      // Find options in modal
      const customOption = screen.getByLabelText('Switch to Custom theme');
      expect(customOption).toBeDefined();

      // Click Custom option
      await act(async () => {
        fireEvent.click(customOption);
      });

      expect(screen.getByText('CUSTOM')).toBeDefined();
    });
  });
});
