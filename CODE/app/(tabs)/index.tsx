import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, THEME_OPTIONS } from '../../constants/theme';
import { s } from '../../styles/bootstrap';
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

export default function LibraryPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, isBW, isCustom, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const {
    playTrack,
    currentTrack,
    isPlaying,
    toggleLike,
    removeTrack,
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

  const openPlayer = () => {
    if (typeof (router as any).navigate === 'function') {
      (router as any).navigate('/player');
    } else {
      router.push('/player');
    }
  };

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    openPlayer();
  };

  const handlePlayAll = async () => {
    await playAll();
    openPlayer();
  };

  const handleShuffleAll = async () => {
    await shuffleAll();
    openPlayer();
  };

  const handleDelete = (track: Track) => {
    Alert.alert(
      'Remove Song',
      `Remove "${track.title}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeTrack(track.id),
        },
      ]
    );
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
          isActive && { backgroundColor: colors.activeRowBg },
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
            { backgroundColor: colors.surface, borderColor: colors.border },
            isActive && { backgroundColor: colors.activeTint, borderColor: colors.primary },
          ]}
        >
          {item.artworkUri ? (
            <Image source={{ uri: item.artworkUri }} style={styles.trackThumbImage} />
          ) : (
            <Ionicons
              name={isActive && isPlaying ? 'play' : 'musical-note'}
              size={20}
              color={colors.textPrimary}
            />
          )}
        </View>

        {/* Track Title & Artist */}
        <View style={[s.flex1, styles.trackInfo]}>
          <Text
            style={[
              styles.trackTitle,
              {
                fontFamily: fonts.familyBold,
                color: colors.textPrimary,
                fontSize: isBW ? 19 : 16,
                letterSpacing: isBW ? 0.6 : 0,
                fontWeight: isBW ? undefined : '600',
                marginBottom: isBW ? 4 : 2,
              },
              isActive && { color: colors.primary },
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

        {/* Duration */}
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
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? colors.danger : colors.textMuted}
          />
        </TouchableOpacity>

        {/* Trash CTA trailing */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
          activeOpacity={0.7}
          accessibilityLabel="Remove track"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, s.flex1, s.px3, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header with Theme Switcher */}
      <View style={[styles.header, s.flexRow, s.alignItemsCenter, s.justifyContentBetween, isBW && { paddingTop: 12, paddingBottom: 22 }]}>
        <View style={[s.flexRow, s.alignItemsCenter]}>
          <Ionicons name="musical-notes" size={isBW ? 32 : 28} color={colors.textPrimary} style={styles.headerIcon} />
          <Text
            style={[
              styles.headerTitle,
              {
                fontFamily: fonts.familyBold,
                color: colors.textPrimary,
                fontSize: isBW ? 34 : 28,
                letterSpacing: isBW ? 1.2 : 0,
                fontWeight: isBW ? undefined : '700',
              },
            ]}
          >
            Your Library
          </Text>
        </View>

        {/* Theme Dropdown Trigger Wrapper */}
        <View style={styles.themeDropdownWrapper}>
          <TouchableOpacity
            style={[
              styles.themePill,
              { borderColor: colors.border, backgroundColor: colors.surface },
              isBW && { paddingHorizontal: 12, paddingVertical: 6 },
            ]}
            onPress={() => setThemeMenuVisible((prev) => !prev)}
            activeOpacity={0.7}
            accessibilityLabel={`Current theme: ${themeMode === 'custom' ? 'Custom' : themeMode === 'bw' ? 'B&W' : 'Classic'}. Tap to choose theme.`}
          >
            <Ionicons
              name={themeMode === 'custom' ? 'sparkles-outline' : themeMode === 'bw' ? 'contrast' : 'color-palette-outline'}
              size={isBW ? 16 : 14}
              color={colors.textPrimary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.themePillText,
                {
                  fontFamily: fonts.familyBold,
                  color: colors.textPrimary,
                  fontSize: isBW ? 13 : 11,
                  letterSpacing: isBW ? 1.2 : 0.8,
                  fontWeight: isBW ? undefined : '700',
                },
              ]}
            >
              {themeMode === 'custom' ? 'CUSTOM' : themeMode === 'bw' ? 'B&W' : 'COLOR'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={colors.textMuted}
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>

          {/* Theme Dropdown Menu anchored right below the pill */}
          {themeMenuVisible && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {THEME_OPTIONS.map((opt) => {
                const isSelected = themeMode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: colors.activeRowBg },
                    ]}
                    onPress={() => {
                      setThemeMode(opt.key);
                      setThemeMenuVisible(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={`Switch to ${opt.label} theme`}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          fontFamily: fonts.familyBold,
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontSize: isBW ? 15 : 13,
                          letterSpacing: isBW ? 0.8 : 0,
                          fontWeight: isBW ? undefined : '600',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Backdrop to dismiss dropdown on outside tap */}
      {themeMenuVisible && (
        <TouchableOpacity
          style={styles.backdropOverlay}
          activeOpacity={1}
          onPress={() => setThemeMenuVisible(false)}
        />
      )}

      {/* Navigation CTAs — Row 1: Import & Liked Songs */}
      <View style={[styles.ctaRow, s.flexRow, s.mb3]}>
        <TouchableOpacity
          style={[
            styles.ctaCard,
            s.flex1,
            s.rounded,
            s.alignItemsCenter,
            s.justifyContentCenter,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isCustom ? styles.ctaCardArtworkBW : (isBW ? { paddingVertical: 12, paddingHorizontal: 12 } : s.p3),
          ]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/import')}
          accessibilityLabel="Import Songs"
        >
          {isCustom ? (
            <Image
              source={require('../../assets/import-icon.png')}
              style={styles.ctaImportImageBWFull}
              resizeMode="cover"
            />
          ) : (
            <>
              <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2, { backgroundColor: colors.cardIconBg }]}>
                <Ionicons name="cloud-upload" size={24} color={colors.textPrimary} />
              </View>
              <Text
                style={[
                  styles.ctaTitle,
                  s.mb1,
                  {
                    fontFamily: fonts.familyBold,
                    color: colors.textPrimary,
                    fontSize: isBW ? 19 : 15,
                    letterSpacing: isBW ? 1 : 0,
                    fontWeight: isBW ? undefined : '600',
                    marginBottom: isBW ? 4 : 2,
                  },
                ]}
              >
                Import Songs
              </Text>
              <Text
                style={[
                  styles.ctaSubtitle,
                  {
                    fontFamily: fonts.family,
                    color: colors.textMuted,
                    fontSize: isBW ? 15 : 12,
                    letterSpacing: isBW ? 0.5 : 0,
                  },
                ]}
              >
                Add from local storage
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.ctaCard,
            s.flex1,
            s.rounded,
            s.alignItemsCenter,
            s.justifyContentCenter,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isCustom ? styles.ctaCardArtworkBW : (isBW ? { paddingVertical: 12, paddingHorizontal: 12 } : s.p3),
          ]}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/liked')}
          accessibilityLabel="Liked Songs"
        >
          {isCustom ? (
            <Image
              source={require('../../assets/liked-icon.png')}
              style={styles.ctaLikedImageBWFull}
              resizeMode="cover"
            />
          ) : (
            <>
              <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2, { backgroundColor: colors.cardIconLikedBg }]}>
                <Ionicons name="heart" size={24} color={isBW ? colors.textPrimary : '#ffffff'} />
              </View>
              <Text
                style={[
                  styles.ctaTitle,
                  s.mb1,
                  {
                    fontFamily: fonts.familyBold,
                    color: colors.textPrimary,
                    fontSize: isBW ? 19 : 15,
                    letterSpacing: isBW ? 1 : 0,
                    fontWeight: isBW ? undefined : '600',
                    marginBottom: isBW ? 4 : 2,
                  },
                ]}
              >
                Liked Songs
              </Text>
              <Text
                style={[
                  styles.ctaSubtitle,
                  {
                    fontFamily: fonts.family,
                    color: colors.textMuted,
                    fontSize: isBW ? 15 : 12,
                    letterSpacing: isBW ? 0.5 : 0,
                  },
                ]}
              >
                View favorites →
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Navigation CTAs — Row 2: Play All & Shuffle All (Only shown when tracks exist) */}
      {tracks.length > 0 && (
        <View style={[styles.ctaRow, s.flexRow, s.mb4]}>
          <TouchableOpacity
            style={[
              styles.ctaCard,
              s.flex1,
              s.rounded,
              s.alignItemsCenter,
              s.justifyContentCenter,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isBW && { paddingVertical: 12, paddingHorizontal: 12 },
            ]}
            activeOpacity={0.7}
            onPress={handlePlayAll}
          >
            <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="play" size={24} color={colors.textPrimary} />
            </View>
            <Text
              style={[
                styles.ctaTitle,
                s.mb1,
                {
                  fontFamily: fonts.familyBold,
                  color: colors.textPrimary,
                  fontSize: isBW ? 19 : 15,
                  letterSpacing: isBW ? 1 : 0,
                  fontWeight: isBW ? undefined : '600',
                  marginBottom: isBW ? 4 : 2,
                },
              ]}
            >
              Play All
            </Text>
            <Text
              style={[
                styles.ctaSubtitle,
                {
                  fontFamily: fonts.family,
                  color: colors.textMuted,
                  fontSize: isBW ? 15 : 12,
                  letterSpacing: isBW ? 0.5 : 0,
                },
              ]}
            >
              Start from top
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctaCard,
              s.flex1,
              s.rounded,
              s.alignItemsCenter,
              s.justifyContentCenter,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isBW && { paddingVertical: 12, paddingHorizontal: 12 },
            ]}
            activeOpacity={0.7}
            onPress={handleShuffleAll}
          >
            <View style={[styles.ctaIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb2, { backgroundColor: colors.cardIconBg }]}>
              <Ionicons name="shuffle" size={24} color={colors.textPrimary} />
            </View>
            <Text
              style={[
                styles.ctaTitle,
                s.mb1,
                {
                  fontFamily: fonts.familyBold,
                  color: colors.textPrimary,
                  fontSize: isBW ? 19 : 15,
                  letterSpacing: isBW ? 1 : 0,
                  fontWeight: isBW ? undefined : '600',
                  marginBottom: isBW ? 4 : 2,
                },
              ]}
            >
              Shuffle All
            </Text>
            <Text
              style={[
                styles.ctaSubtitle,
                {
                  fontFamily: fonts.family,
                  color: colors.textMuted,
                  fontSize: isBW ? 15 : 12,
                  letterSpacing: isBW ? 0.5 : 0,
                },
              ]}
            >
              Play in random order
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Track list / empty state */}
      {tracks.length === 0 ? (
        <View style={[styles.emptyState, s.flex1, s.alignItemsCenter, s.justifyContentCenter]}>
          <View style={[styles.emptyIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter, s.mb3, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="musical-notes-outline" size={36} color={colors.textPrimary} />
          </View>
          <Text style={[styles.emptyTitle, s.mb1, { fontFamily: fonts.familyBold, color: colors.textPrimary }]}>No songs yet</Text>
          <Text style={[styles.emptySubtitle, { fontFamily: fonts.family, color: colors.textMuted }]}>
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
              tintColor={colors.primary}
              colors={[colors.primary]}
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
    paddingTop: 8,
    paddingBottom: 20,
    zIndex: 1000,
  },
  headerIcon: { marginRight: 12 },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  ctaRow: {
    gap: 12,
  },
  ctaCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 128,
  },
  ctaIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(13, 110, 253, 0.15)',
  },
  ctaIconLiked: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
  },
  ctaCardArtworkBW: {
    padding: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Custom Import Artwork Tile - Latest
  ctaImportImageBWFull: {
    width: '112%',
    height: '100%',
    transform: [{ translateX: -12 }],
  },
  ctaLikedImageBWFull: {
    width: '112%',
    height: '100%',
    transform: [{ translateX: -12 }],
  },
  themeDropdownWrapper: {
    position: 'relative',
    zIndex: 1001,
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 1,
    width: 165,
    borderRadius: Radii.large,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 9999,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemText: {
    fontSize: 14,
  },
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
  heartBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
