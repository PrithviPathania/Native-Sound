import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radii } from '../../constants/theme';
import { getLikedTracks } from '../../services/database';
import { useAudio } from '../../context/AudioContext';
import type { Track } from '../../types/track';

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function LikedSongsPage() {
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying, toggleLike } = useAudio();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload liked tracks every time this screen is focused.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const liked = await getLikedTracks();
          if (!cancelled) setTracks(liked);
        } catch (err) {
          console.error('[Liked] Failed to load:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    router.push('/player');
  };

  const handleUnlike = async (track: Track) => {
    try {
      // Remove from local list immediately for instant feedback
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
      // Sync with DB and global context state
      await toggleLike(track.id);
    } catch (err) {
      // Re-add to list on failure
      setTracks((prev) => [track, ...prev]);
      Alert.alert('Error', 'Could not update liked status.');
    }
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.trackRow, isActive && styles.trackRowActive]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        <View style={[styles.trackThumb, isActive && styles.trackThumbActive]}>
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Text style={styles.trackThumbIcon}>{isActive && isPlaying ? '▶' : '♪'}</Text>
          )}
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isActive && styles.trackTitleActive]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
        <TouchableOpacity onPress={() => handleUnlike(item)} style={styles.heartBtn}>
          <Text style={styles.heartIcon}>❤</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Library</Text>
      </TouchableOpacity>

      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.heartBig}>❤️</Text>
        <Text style={styles.pageTitle}>Liked Songs</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyHeart}>♥</Text>
          </View>
          <Text style={styles.emptyTitle}>No liked songs yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the ♥ on any track to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrack}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backArrow: { fontSize: 20, color: Colors.primary, marginRight: 6 },
  backText: { fontSize: 16, fontFamily: 'Inter', color: Colors.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  heartBig: { fontSize: 28, marginRight: 12 },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger + '15',
    borderWidth: 1,
    borderColor: Colors.danger + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHeart: { fontSize: 32, color: Colors.danger },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  listContent: { paddingBottom: 16 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.standard,
    marginBottom: 4,
  },
  trackRowActive: { backgroundColor: Colors.primary + '15' },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: Radii.standard,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  trackThumbActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  trackThumbImage: {
    width: '100%',
    height: '100%',
  },
  trackThumbIcon: { fontSize: 18, color: Colors.textMuted },
  trackInfo: { flex: 1 },
  trackTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  trackTitleActive: { color: Colors.primary },
  trackArtist: { fontSize: 13, fontFamily: 'Inter', color: Colors.textMuted },
  trackDuration: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginLeft: 8,
  },
  heartBtn: { padding: 8 },
  heartIcon: { fontSize: 18, color: Colors.danger },
});
