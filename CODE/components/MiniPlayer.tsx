import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { s } from '../styles/bootstrap';
import { useAudio } from '../context/AudioContext';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentTrack, isPlaying, togglePlayPause, currentTime, duration } = useAudio();

  // Don't render if no track is loaded or if player modal is open
  if (!currentTrack || pathname === '/player' || pathname?.includes('/player')) {
    return null;
  }

  // Calculate 2px top progress bar percentage
  const progressPct = duration > 0 ? clamp(currentTime / duration, 0, 1) * 100 : 0;

  return (
    <View style={[styles.container, s.flexRow, s.alignItemsCenter]}>
      {/* 2px top progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Tap info area to expand full player modal */}
      <TouchableOpacity
        style={[styles.infoArea, s.flex1, s.flexRow, s.alignItemsCenter]}
        activeOpacity={0.8}
        onPress={() => router.push('/player')}
      >
        {/* 40x40 Thumbnail with rounded-2 */}
        <View style={[styles.thumbnail, s.rounded, s.alignItemsCenter, s.justifyContentCenter]}>
          {currentTrack.artworkUri ? (
            <Image source={{ uri: currentTrack.artworkUri }} style={styles.thumbnailImage} />
          ) : (
            <Ionicons name="musical-note" size={20} color="#ffffff" />
          )}
        </View>

        {/* Track info column */}
        <View style={[s.flex1, s.flexColumn, s.justifyContentCenter]}>
          <Text style={[styles.title, s.textWhite]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, s.textSecondary]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Play / Pause button with rounded-circle & primary background */}
      <TouchableOpacity
        style={[styles.playBtn, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter]}
        activeOpacity={0.8}
        onPress={togglePlayPause}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    position: 'relative',
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  infoArea: {
    height: '100%',
  },
  thumbnail: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  playBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    marginLeft: 12,
  },
});
