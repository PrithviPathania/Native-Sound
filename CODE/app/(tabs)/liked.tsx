import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { s } from '../../styles/bootstrap';
import { getLikedTracks } from '../../services/database';
import { useAudio } from '../../context/AudioContext';
import type { Track } from '../../types/track';

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          isActive && styles.trackRowActive,
        ]}
        activeOpacity={0.7}
        onPress={() => handleTrackPress(item)}
      >
        <View style={[styles.trackThumb, s.rounded, s.alignItemsCenter, s.justifyContentCenter, isActive && styles.trackThumbActive]}>
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Ionicons
              name={isActive && isPlaying ? 'play' : 'musical-note'}
              size={20}
              color="#ffffff"
            />
          )}
        </View>
        <View style={[s.flex1, styles.trackInfo]}>
          <Text style={[styles.trackTitle, s.textWhite, isActive && styles.trackTitleActive]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.trackArtist, s.textSecondary]} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Text style={[styles.trackDuration, s.textSecondary]}>{formatDuration(item.duration)}</Text>
        <TouchableOpacity onPress={() => handleUnlike(item)} style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, s.flex1, s.bgDark, s.px3]}>
      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, s.flexRow, s.alignItemsCenter, s.py2]}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={20} color={Colors.primary} style={styles.backArrow} />
        <Text style={[styles.backText, s.textPrimary]}>Library</Text>
      </TouchableOpacity>

      {/* Page header with danger color heart */}
      <View style={[styles.header, s.flexRow, s.alignItemsCenter, s.py3]}>
        <Ionicons name="heart" size={28} color={Colors.danger} style={styles.heartBig} />
        <Text style={[styles.pageTitle, s.textWhite]}>Liked Songs</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={[s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={[styles.emptyState, s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <View style={[styles.emptyIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb3]}>
            <Ionicons name="heart" size={32} color={Colors.danger} />
          </View>
          <Text style={[styles.emptyTitle, s.textWhite, s.mb1]}>No liked songs yet</Text>
          <Text style={[styles.emptySubtitle, s.textSecondary]}>
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
  backButton: {
    minHeight: 44,
  },
  backArrow: { marginRight: 4 },
  backText: { fontSize: 16, fontFamily: 'Inter', color: Colors.primary },
  header: {
    paddingTop: 8,
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
