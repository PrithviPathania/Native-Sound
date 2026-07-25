import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors, Radii } from '../../constants/theme';
import { getAllTracks } from '../../services/database';
import { useAudio } from '../../context/AudioContext';
import type { Track } from '../../types/track';

export default function LibraryPage() {
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload the track list every time this screen comes into focus
  // (e.g. after returning from the Import page with a new track).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const data = await getAllTracks();
          if (!cancelled) setTracks(data);
        } catch (err) {
          console.error('[Library] Failed to load tracks:', err);
          Alert.alert('Error', 'Could not load your library.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    router.push('/player');
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.trackRow, isActive && styles.trackRowActive]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        {/* Album art placeholder */}
        <View style={[styles.trackThumb, isActive && styles.trackThumbActive]}>
          <Text style={styles.trackThumbIcon}>{isActive && isPlaying ? '▶' : '♪'}</Text>
        </View>

        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, isActive && styles.trackTitleActive]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        {item.isLiked && <Text style={styles.heartBadge}>❤</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🎵</Text>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      {/* Navigation CTAs */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/import')}
        >
          <View style={styles.ctaIconContainer}>
            <Text style={styles.ctaIcon}>📥</Text>
          </View>
          <Text style={styles.ctaTitle}>Import Songs</Text>
          <Text style={styles.ctaSubtitle}>Add from local storage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/liked')}
        >
          <View style={[styles.ctaIconContainer, styles.ctaIconLiked]}>
            <Text style={styles.ctaIcon}>❤️</Text>
          </View>
          <Text style={styles.ctaTitle}>Liked Songs</Text>
          <Text style={styles.ctaSubtitle}>View favorites →</Text>
        </TouchableOpacity>
      </View>

      {/* Track list / empty state */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>♪</Text>
          </View>
          <Text style={styles.emptyTitle}>No songs yet</Text>
          <Text style={styles.emptySubtitle}>
            Import your first track to get started
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerIcon: { fontSize: 28, marginRight: 12 },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  ctaCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.standard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaIconLiked: { backgroundColor: Colors.danger + '20' },
  ctaIcon: { fontSize: 22 },
  ctaTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 32, color: Colors.textMuted },
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
  trackRowActive: {
    backgroundColor: Colors.primary + '15',
  },
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
  },
  trackThumbActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
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
  trackArtist: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: Colors.textMuted,
  },
  heartBadge: {
    fontSize: 14,
    color: Colors.danger,
    marginLeft: 8,
  },
});
