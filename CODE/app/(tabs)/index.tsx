import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radii } from '../../constants/theme';
import { useAudio } from '../../context/AudioContext';
import type { Track } from '../../types/track';

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function LibraryPage() {
  const router = useRouter();
  const { playTrack, currentTrack, isPlaying, toggleLike, tracks, refreshTracks } = useAudio();
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch from SQLite into AudioContext every time this screen comes into focus.
  // Because tracks comes from AudioContext, toggleLike updates are reflected immediately.
  useFocusEffect(
    useCallback(() => {
      refreshTracks();
    }, [refreshTracks])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTracks();
    setRefreshing(false);
  }, [refreshTracks]);

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    router.push('/player');
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.trackRow, isActive && styles.trackRowActive]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        {/* Album art thumbnail / placeholder */}
        <View style={[styles.trackThumb, isActive && styles.trackThumbActive]}>
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Text style={styles.trackThumbIcon}>{isActive && isPlaying ? '▶' : '♪'}</Text>
          )}
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

        <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>

        <TouchableOpacity
          style={styles.heartBtn}
          onPress={(e) => { e.stopPropagation(); toggleLike(item.id); }}
          activeOpacity={0.7}
          accessibilityLabel={(item.liked || item.isLiked) ? 'Unlike track' : 'Like track'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[
            styles.heartBadge,
            !(item.liked || item.isLiked) && styles.heartBadgeUnliked,
          ]}>
            {(item.liked || item.isLiked) ? '❤' : '🤍'}
          </Text>
        </TouchableOpacity>
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
      {tracks.length === 0 ? (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
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
    overflow: 'hidden',
  },
  trackThumbActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  trackThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.standard,
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
  trackDuration: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginLeft: 8,
  },
  heartBadge: {
    fontSize: 16,
    color: Colors.danger,
  },
  heartBadgeUnliked: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  heartBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
