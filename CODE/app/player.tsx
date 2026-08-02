import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../constants/theme';
import { useAudio } from '../context/AudioContext';

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '—:——';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const { currentTrack, isPlaying, togglePlayPause } = useAudio();

  const title = currentTrack?.title ?? 'No track selected';
  const artist = currentTrack?.artist ?? '—';

  return (
    <View style={styles.container}>
      {/* Dismiss chevron */}
      <TouchableOpacity
        style={styles.dismissArea}
        onPress={() => router.back()}
        activeOpacity={0.6}
      >
        <View style={styles.dismissHandle} />
        <Text style={styles.dismissLabel}>Player</Text>
      </TouchableOpacity>

      {/* Album Art */}
      <View style={styles.albumArt}>
        {currentTrack?.artworkUri ? (
          <Image source={{ uri: currentTrack.artworkUri }} style={styles.albumArtImage} />
        ) : (
          <Text style={styles.albumArtIcon}>♪</Text>
        )}
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.trackArtist}>{artist}</Text>
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        {/* Skip back (placeholder) */}
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={[styles.controlBtn, styles.playBtn]}
          onPress={togglePlayPause}
          disabled={!currentTrack}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Skip forward (placeholder) */}
        <TouchableOpacity style={styles.controlBtn}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar placeholder */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[styles.progressFill, { width: currentTrack ? '30%' : '0%' }]}
          />
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.timeText}>0:00</Text>
          <Text style={styles.timeText}>{formatDuration(currentTrack?.duration)}</Text>
        </View>
      </View>

      {/* Volume slider placeholder */}
      <View style={styles.volumeRow}>
        <Text style={styles.volumeIcon}>🔈</Text>
        <View style={styles.volumeTrack}>
          <View style={styles.volumeFill} />
        </View>
        <Text style={styles.volumeIcon}>🔊</Text>
      </View>
    </View>
  );
}

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
  trackInfo: { marginBottom: 32 },
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
  progressContainer: { marginBottom: 24 },
  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeIcon: { fontSize: 18 },
  volumeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    width: '70%',
    height: '100%',
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
  },
});
