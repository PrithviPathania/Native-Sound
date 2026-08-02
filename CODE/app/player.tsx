import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../constants/theme';
import { useAudio } from '../context/AudioContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// Inline slider (no external dependencies)
// PanResponder-based so it works on both iOS and Android.
// ---------------------------------------------------------------------------
interface SliderProps {
  value: number;        // 0–1
  onValueChange: (v: number) => void;
  onSlidingComplete: (v: number) => void;
  thumbColor?: string;
  trackColor?: string;
  activeTrackColor?: string;
}

function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  thumbColor = Colors.primary,
  trackColor = Colors.border,
  activeTrackColor = Colors.primary,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [sliding, setSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(value);

  const displayValue = sliding ? slideValue : value;

  const valueFromEvent = useCallback(
    (evt: GestureResponderEvent): number => {
      const x = evt.nativeEvent.locationX;
      return clamp(x / trackWidth, 0, 1);
    },
    [trackWidth]
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setSliding(true);
      const v = valueFromEvent(evt);
      setSlideValue(v);
      onValueChange(v);
    },
    onPanResponderMove: (evt) => {
      const v = clamp(
        (evt.nativeEvent.locationX) / trackWidth,
        0,
        1
      );
      setSlideValue(v);
      onValueChange(v);
    },
    onPanResponderRelease: (evt) => {
      const v = clamp(
        (evt.nativeEvent.locationX) / trackWidth,
        0,
        1
      );
      setSlideValue(v);
      setSliding(false);
      onSlidingComplete(v);
    },
  });

  return (
    <View
      style={sliderStyles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* Background track */}
      <View style={[sliderStyles.trackBg, { backgroundColor: trackColor }]} />
      {/* Active / filled track */}
      <View
        style={[
          sliderStyles.trackFill,
          { width: `${displayValue * 100}%`, backgroundColor: activeTrackColor },
        ]}
      />
      {/* Thumb */}
      <View
        style={[
          sliderStyles.thumb,
          { left: `${displayValue * 100}%`, backgroundColor: thumbColor },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    top: '50%',
    marginTop: -8,
  },
});

// ---------------------------------------------------------------------------
// Player Screen
// ---------------------------------------------------------------------------
export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
  } = useAudio();

  const title = currentTrack?.title ?? 'No track selected';
  const artist = currentTrack?.artist ?? '—';

  // Normalised progress (0–1). Guard against divide-by-zero.
  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;

  // Progress slider handlers
  const handleProgressChange = useCallback((_v: number) => {
    // Provide live feedback during drag (no-op: context time won't update
    // while sliding, so the slider thumb follows the gesture via slideValue)
  }, []);

  const handleProgressComplete = useCallback(
    (normalised: number) => {
      if (duration > 0) {
        seekTo(normalised * duration);
      }
    },
    [duration, seekTo]
  );

  // Volume slider handlers
  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolume(v);
    },
    [setVolume]
  );

  return (
    <View style={styles.container}>
      {/* ── Dismiss chevron ── */}
      <TouchableOpacity
        style={styles.dismissArea}
        onPress={() => router.back()}
        activeOpacity={0.6}
        accessibilityLabel="Close player"
      >
        <View style={styles.dismissHandle} />
        <Text style={styles.dismissLabel}>Player</Text>
      </TouchableOpacity>

      {/* ── Album Art ── */}
      <View style={styles.albumArt}>
        {currentTrack?.artworkUri ? (
          <Image
            source={{ uri: currentTrack.artworkUri }}
            style={styles.albumArtImage}
          />
        ) : (
          <Text style={styles.albumArtIcon}>♪</Text>
        )}
      </View>

      {/* ── Track info ── */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.trackArtist}>{artist}</Text>
      </View>

      {/* ── Progress bar with time labels ── */}
      <View style={styles.progressContainer}>
        <Slider
          value={progress}
          onValueChange={handleProgressChange}
          onSlidingComplete={handleProgressComplete}
          activeTrackColor={Colors.primary}
          trackColor={Colors.border}
          thumbColor={Colors.primary}
        />
        <View style={styles.progressTimes}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
        </View>
      </View>

      {/* ── Playback controls ── */}
      <View style={styles.controls}>
        {/* Previous track */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={playPrevious}
          accessibilityLabel="Previous track"
        >
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={[styles.controlBtn, styles.playBtn]}
          onPress={togglePlayPause}
          disabled={!currentTrack}
          activeOpacity={0.8}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Next track */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={playNext}
          accessibilityLabel="Next track"
        >
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* ── Volume slider ── */}
      <View style={styles.volumeRow}>
        <Text style={styles.volumeIcon}>🔈</Text>
        <View style={styles.volumeSlider}>
          <Slider
            value={volume}
            onValueChange={handleVolumeChange}
            onSlidingComplete={handleVolumeChange}
            activeTrackColor={Colors.textMuted}
            trackColor={Colors.border}
            thumbColor={Colors.textMuted}
          />
        </View>
        <Text style={styles.volumeIcon}>🔊</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — identical structure to original, no visual change
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  dismissArea: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  dismissHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  dismissLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: Radii.large,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 28,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  albumArtIcon: { fontSize: 80, color: Colors.textMuted },
  trackInfo: { marginBottom: 24 },
  trackTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  progressContainer: { marginBottom: 24 },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: { fontSize: 24, color: Colors.textMuted },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
  },
  playIcon: { fontSize: 28, color: Colors.textPrimary },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeIcon: { fontSize: 18 },
  volumeSlider: { flex: 1 },
});
