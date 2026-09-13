import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../../constants/theme';
import { s } from '../../styles/bootstrap';
import { getLikedTracks } from '../../services/database';
import { useAudio } from '../../context/AudioContext';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Track } from '../../types/track';

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LikedSongsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playTrack, currentTrack, isPlaying, toggleLike } = useAudio();
  const { colors, fonts, isBW } = useTheme();

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

  const openPlayer = () => {
    if (typeof (router as any).navigate === 'function') {
      (router as any).navigate('/player');
    } else {
      router.push('/player');
    }
  };

  const handleBackToLibrary = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (typeof (router as any).navigate === 'function') {
      (router as any).navigate('/(tabs)/');
    } else {
      router.replace('/(tabs)/');
    }
  };

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    openPlayer();
  };

  const handleUnlike = async (track: Track) => {
    try {
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
      await toggleLike(track.id);
    } catch (err) {
      setTracks((prev) => [track, ...prev]);
      Alert.alert('Error', 'Could not update liked status.');
    }
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.trackRow,
          s.flexRow,
          s.alignItemsCenter,
          s.p2,
          s.mb2,
          s.rounded,
          isBW && { minHeight: 58, paddingVertical: 10 },
          isActive && { backgroundColor: colors.activeRowBg },
        ]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        <View
          style={[
            styles.trackThumb,
            s.rounded,
            s.alignItemsCenter,
            s.justifyContentCenter,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isActive && { backgroundColor: colors.activeRowBg, borderColor: colors.primary },
          ]}
        >
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Ionicons
              name={isActive && isPlaying ? 'play' : 'musical-note'}
              size={20}
              color={isActive ? colors.primary : '#ffffff'}
            />
          )}
        </View>
        <View style={[s.flex1, styles.trackInfo]}>
          <Text
            style={[
              styles.trackTitle,
              {
                fontFamily: fonts.familyBold,
                color: isActive ? colors.primary : colors.textPrimary,
                fontSize: isBW ? 19 : 16,
                letterSpacing: isBW ? 0.6 : 0,
                fontWeight: isBW ? undefined : '600',
                marginBottom: isBW ? 4 : 2,
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.trackArtist,
              {
                fontFamily: fonts.family,
                color: colors.textMuted,
                fontSize: isBW ? 15 : 14,
                letterSpacing: isBW ? 0.5 : 0,
              },
            ]}
            numberOfLines={1}
          >
            {item.artist}
          </Text>
        </View>
        <Text
          style={[
            styles.trackDuration,
            {
              fontFamily: fonts.family,
              color: colors.textMuted,
              fontSize: isBW ? 15 : 12,
              letterSpacing: isBW ? 0.5 : 0,
              marginRight: isBW ? 10 : 8,
            },
          ]}
        >
          {formatDuration(item.duration)}
        </Text>
        <TouchableOpacity
          onPress={() => handleUnlike(item)}
          style={styles.heartBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Unlike ${item.title}`}
        >
          <Ionicons name="heart" size={20} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, s.flex1, s.px3, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Back to Library CTA Box */}
      <TouchableOpacity
        style={[
          styles.libraryCard,
          s.flexRow,
          s.alignItemsCenter,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isBW && { paddingHorizontal: 14, paddingVertical: 9, marginBottom: 16 },
        ]}
        activeOpacity={0.7}
        onPress={handleBackToLibrary}
        accessibilityLabel="Back to Library"
      >
        <View style={[styles.libraryIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, { backgroundColor: colors.activeRowBg, marginRight: isBW ? 10 : 8 }]}>
          <Ionicons name="chevron-back" size={16} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.libraryCardTitle,
            {
              fontFamily: fonts.familyBold,
              color: colors.textPrimary,
              fontSize: isBW ? 16 : 14,
              letterSpacing: isBW ? 1 : 0,
              fontWeight: isBW ? undefined : '600',
            },
          ]}
        >
          Library
        </Text>
      </TouchableOpacity>

      {/* Page header */}
      <View style={[styles.header, s.flexRow, s.alignItemsCenter, isBW && { paddingTop: 8, paddingBottom: 20 }]}>
        <Text
          style={[
            styles.pageTitle,
            {
              fontFamily: fonts.familyBold,
              color: colors.textPrimary,
              fontSize: isBW ? 34 : 28,
              letterSpacing: isBW ? 1.2 : 0,
              fontWeight: isBW ? undefined : '700',
            },
          ]}
        >
          Liked Songs
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={[s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={[styles.emptyState, s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <View
            style={[
              styles.emptyIconContainer,
              s.roundedCircle,
              s.alignItemsCenter,
              s.justifyContentCenter,
              s.mb3,
              { backgroundColor: colors.activeRowBg, borderColor: isBW ? 'rgba(255, 255, 255, 0.3)' : 'rgba(220, 53, 69, 0.3)' },
            ]}
          >
            <Ionicons name="heart" size={32} color={colors.danger} />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              {
                fontFamily: fonts.familyBold,
                color: colors.textPrimary,
                fontSize: isBW ? 24 : 20,
                letterSpacing: isBW ? 1 : 0,
                fontWeight: isBW ? undefined : '600',
              },
              s.mb1,
            ]}
          >
            No liked songs yet
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                fontFamily: fonts.family,
                color: colors.textMuted,
                fontSize: isBW ? 16 : 14,
                letterSpacing: isBW ? 0.5 : 0,
              },
            ]}
          >
            Tap the heart on any track to save it here
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
    backgroundColor: Colors.background,
  },
  libraryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.standard,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  libraryIconContainer: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(13, 110, 253, 0.15)',
    marginRight: 8,
  },
  libraryCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  header: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  heartBig: { marginRight: 12 },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  emptyState: {
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
  },
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
  trackRowActive: { backgroundColor: 'rgba(13, 110, 253, 0.15)' },
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
  trackInfo: { marginRight: 8 },
  trackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    marginBottom: 2,
  },
  trackTitleActive: { color: Colors.primary },
  trackArtist: { fontSize: 14, fontFamily: 'Inter' },
  trackDuration: {
    fontSize: 12,
    fontFamily: 'Inter',
    marginRight: 8,
  },
  heartBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
