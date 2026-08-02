import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radii } from '../../constants/theme';
import { s, c } from '../../styles/bootstrap';
import { useAudio } from '../../context/AudioContext';
import type { Track } from '../../types/track';

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const router = useRouter();
  const {
    playTrack,
    currentTrack,
    isPlaying,
    toggleLike,
    tracks,
    refreshTracks,
    playAll,
    shuffleAll,
  } = useAudio();
  const [refreshing, setRefreshing] = useState(false);

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

  const handlePlayAll = async () => {
    await playAll();
    router.push('/player');
  };

  const handleShuffleAll = async () => {
    await shuffleAll();
    router.push('/player');
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    const isLiked = item.liked || item.isLiked;

    return (
      <TouchableOpacity
        style={[
          styles.trackRow,
          s.flexRow,
          s.alignItemsCenter,
          s.p2,
          s.mb2,
          s.rounded,
          isActive && styles.trackRowActive,
        ]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        {/* 48x48 Thumbnail with rounded-2 */}
        <View
          style={[
            styles.trackThumb,
            s.rounded,
            s.alignItemsCenter,
            s.justifyContentCenter,
            isActive && styles.trackThumbActive,
          ]}
        >
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Text style={styles.trackThumbIcon}>{isActive && isPlaying ? '▶' : '♪'}</Text>
          )}
        </View>

        {/* Track Title & Artist */}
        <View style={[s.flex1, styles.trackInfo]}>
          <Text
            style={[
              styles.trackTitle,
              s.textWhite,
              isActive && styles.trackTitleActive,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.trackArtist, s.textSecondary]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        {/* Duration */}
        <Text style={[styles.trackDuration, s.textSecondary]}>
          {formatDuration(item.duration)}
        </Text>

        {/* Heart CTA trailing */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={(e) => {
            e.stopPropagation();
            toggleLike(item.id);
          }}
          activeOpacity={0.7}
          accessibilityLabel={isLiked ? 'Unlike track' : 'Like track'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.heartBadge,
              !isLiked && styles.heartBadgeUnliked,
            ]}
          >
            {isLiked ? '❤' : '🤍'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, s.flex1, s.bgDark, s.px3]}>
      {/* Header */}
      <View style={[styles.header, s.flexRow, s.alignItemsCenter, s.py3]}>
        <Text style={styles.headerIcon}>🎵</Text>
        <Text style={[styles.headerTitle, s.textWhite]}>Your Library</Text>
      </View>

      {/* Navigation CTAs — Row 1: Import & Liked Songs */}
      <View style={[styles.ctaRow, s.flexRow, s.mb3]}>
        <TouchableOpacity
          style={[styles.ctaCard, s.flex1, s.p3, s.rounded, s.alignItemsCenter]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/import')}
        >
          <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2]}>
            <Text style={styles.ctaIcon}>📥</Text>
          </View>
          <Text style={[styles.ctaTitle, s.textWhite, s.mb1]}>Import Songs</Text>
          <Text style={[styles.ctaSubtitle, s.textSecondary]}>Add from local storage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaCard, s.flex1, s.p3, s.rounded, s.alignItemsCenter]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/liked')}
        >
          <View style={[styles.ctaIconContainer, styles.ctaIconLiked, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2]}>
            <Text style={styles.ctaIcon}>❤️</Text>
          </View>
          <Text style={[styles.ctaTitle, s.textWhite, s.mb1]}>Liked Songs</Text>
          <Text style={[styles.ctaSubtitle, s.textSecondary]}>View favorites →</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation CTAs — Row 2: Play All & Shuffle All (Only shown when tracks exist) */}
      {tracks.length > 0 && (
        <View style={[styles.ctaRow, s.flexRow, s.mb4]}>
          <TouchableOpacity
            style={[styles.ctaCard, s.flex1, s.p3, s.rounded, s.alignItemsCenter]}
            activeOpacity={0.7}
            onPress={handlePlayAll}
          >
            <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2]}>
              <Text style={styles.ctaIcon}>▶️</Text>
            </View>
            <Text style={[styles.ctaTitle, s.textWhite, s.mb1]}>Play All</Text>
            <Text style={[styles.ctaSubtitle, s.textSecondary]}>Start from top</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaCard, s.flex1, s.p3, s.rounded, s.alignItemsCenter]}
            activeOpacity={0.7}
            onPress={handleShuffleAll}
          >
            <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2]}>
              <Text style={styles.ctaIcon}>🔀</Text>
            </View>
            <Text style={[styles.ctaTitle, s.textWhite, s.mb1]}>Shuffle All</Text>
            <Text style={[styles.ctaSubtitle, s.textSecondary]}>Play in random order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Track list / empty state */}
      {tracks.length === 0 ? (
        <View style={[styles.emptyState, s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <View style={[styles.emptyIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb3]}>
            <Text style={styles.emptyIcon}>♪</Text>
          </View>
          <Text style={[styles.emptyTitle, s.textWhite, s.mb1]}>No songs yet</Text>
          <Text style={[styles.emptySubtitle, s.textSecondary]}>
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerIcon: { fontSize: 28, marginRight: 12 },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  ctaRow: {
    gap: 12,
  },
  ctaCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(13, 110, 253, 0.15)',
  },
  ctaIconLiked: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
  },
  ctaIcon: { fontSize: 20 },
  ctaTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  ctaSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  emptyState: {
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 32, color: Colors.textMuted },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  listContent: { paddingBottom: 16 },
  trackRow: {
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  trackRowActive: {
    backgroundColor: 'rgba(13, 110, 253, 0.15)',
  },
  trackThumb: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
    overflow: 'hidden',
  },
  trackThumbActive: {
    backgroundColor: 'rgba(13, 110, 253, 0.3)',
    borderColor: Colors.primary,
  },
  trackThumbImage: {
    width: '100%',
    height: '100%',
  },
  trackThumbIcon: { fontSize: 18, color: Colors.textMuted },
  trackInfo: { marginRight: 8 },
  trackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    marginBottom: 2,
  },
  trackTitleActive: { color: Colors.primary },
  trackArtist: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  trackDuration: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginRight: 8,
  },
  heartBadge: {
    fontSize: 18,
    color: Colors.danger,
  },
  heartBadgeUnliked: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  heartBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
