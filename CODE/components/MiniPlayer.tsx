import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAudio } from '../context/AudioContext';

export default function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, isPlaying, togglePlayPause } = useAudio();

  // Don't render anything if no track has been loaded yet.
  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      {/* Tap the info section to open the full player modal */}
      <TouchableOpacity
        style={styles.infoArea}
        activeOpacity={0.8}
        onPress={() => router.push('/player')}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>♪</Text>
        </View>

        {/* Track title & artist */}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Play / Pause button */}
      <TouchableOpacity
        style={styles.playBtn}
        activeOpacity={0.8}
        onPress={togglePlayPause}
      >
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 70,
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbnailIcon: { fontSize: 18, color: Colors.textMuted },
  textBlock: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  playIcon: { fontSize: 18, color: Colors.textPrimary },
});
