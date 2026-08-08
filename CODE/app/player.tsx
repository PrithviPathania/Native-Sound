import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  PanResponder,
  type GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { s } from '../styles/bootstrap';
import { useAudio } from '../context/AudioContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// Inline Slider (PanResponder based)
// ---------------------------------------------------------------------------
interface SliderProps {
  value: number;        // 0–1
  onValueChange: (v: number) => void;
  onSlidingComplete: (v: number) => void;
  thumbColor?: string;
  trackColor?: string;
  activeTrackColor?: string;
}

function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  thumbColor = Colors.primary,
  trackColor = Colors.border,
  activeTrackColor = Colors.primary,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [sliding, setSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(value);

  const displayValue = sliding ? slideValue : value;

  const valueFromEvent = useCallback(
    (evt: GestureResponderEvent): number => {
      const x = evt.nativeEvent.locationX;
      return clamp(x / trackWidth, 0, 1);
    },
    [trackWidth]
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setSliding(true);
      const v = valueFromEvent(evt);
      setSlideValue(v);
      onValueChange(v);
    },
    onPanResponderMove: (evt) => {
      const v = clamp(evt.nativeEvent.locationX / trackWidth, 0, 1);
      setSlideValue(v);
      onValueChange(v);
    },
    onPanResponderRelease: (evt) => {
      const v = clamp(evt.nativeEvent.locationX / trackWidth, 0, 1);
      setSlideValue(v);
      setSliding(false);
      onSlidingComplete(v);
    },
  });

  return (
    <View
      style={sliderStyles.trackContainer}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[sliderStyles.trackBg, { backgroundColor: trackColor }]} />
      <View
        style={[
          sliderStyles.trackFill,
          { width: `${displayValue * 100}%`, backgroundColor: activeTrackColor },
        ]}
      />
      <View
        style={[
          sliderStyles.thumb,
          { left: `${displayValue * 100}%`, backgroundColor: thumbColor },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  trackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    top: '50%',
    marginTop: -8,
  },
});

// ---------------------------------------------------------------------------
// Player Modal Screen
// ---------------------------------------------------------------------------
export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
  } = useAudio();

  const isLiked = currentTrack ? (currentTrack.liked || currentTrack.isLiked || false) : false;
  const title = currentTrack?.title ?? 'No track selected';
  const artist = currentTrack?.artist ?? '—';

  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;

  // Swipe-to-dismiss gesture responder
  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          router.back();
        }
      },
    })
  ).current;

  const handleProgressComplete = useCallback(
    (normalised: number) => {
      if (duration > 0) {
        seekTo(normalised * duration);
      }
    },
    [duration, seekTo]
  );

  return (
    <View
      style={[styles.container, s.flex1, s.flexColumn, s.justifyContentBetween, s.px3, s.pb4]}
      {...swipePanResponder.panHandlers}
    >
      {/* ── 1. Dismiss Chevron / Handle at top ── */}
      <TouchableOpacity
        style={[styles.dismissArea, s.alignItemsCenter, s.py2, s.mb2]}
        onPress={() => router.back()}
        activeOpacity={0.6}
        accessibilityLabel="Close player"
      >
        <Ionicons name="chevron-down" size={24} color="#ffffff" />
        <Text style={[styles.dismissLabel, s.textSecondary]}>Player</Text>
      </TouchableOpacity>

      {/* ── Main Vertical Content Stack ── */}
      <View style={[s.flex1, s.flexColumn, s.justifyContentCenter, s.alignItemsCenter, s.w100]}>
        {/* ── 2. Album Art (centered horizontally) ── */}
        <View style={[styles.albumArt, s.roundedLg, s.alignItemsCenter, s.justifyContentCenter, s.alignSelfCenter, s.mb4]}>
          {currentTrack?.artworkUri ? (
            <Image source={{ uri: currentTrack.artworkUri }} style={styles.albumArtImage} />
          ) : (
            <Ionicons name="musical-notes" size={72} color="#ffffff" />
          )}
        </View>

        {/* ── 3. Track Title + Artist (centered text) ── */}
        <View style={[styles.trackInfo, s.alignItemsCenter, s.mb4, s.w100]}>
          <Text style={[styles.trackTitle, s.textWhite, { textAlign: 'center' }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.trackArtist, s.textSecondary, { textAlign: 'center' }]}>{artist}</Text>
        </View>

        {/* ── 4. Progress Slider with Time Labels ── */}
        <View style={[styles.progressContainer, s.w100, s.mb4]}>
          <Slider
            value={progress}
            onValueChange={() => {}}
            onSlidingComplete={handleProgressComplete}
            activeTrackColor={Colors.primary}
            trackColor={Colors.border}
            thumbColor={Colors.primary}
          />
          <View style={[s.flexRow, s.justifyContentBetween, s.alignItemsCenter, s.mt1]}>
            <Text style={[styles.timeText, s.textSecondary]}>{formatTime(currentTime)}</Text>
            <Text style={[styles.timeText, s.textSecondary]}>-{formatTime(remaining)}</Text>
          </View>
        </View>

        {/* ── 5. Playback Controls Row (previous, play/pause, next — evenly spaced) ── */}
        <View style={[styles.playbackControls, s.flexRow, s.alignItemsCenter, s.justifyContentCenter, s.w100, s.mb4]}>
          {/* Previous track */}
          <TouchableOpacity
            style={[styles.controlBtn, s.alignItemsCenter, s.justifyContentCenter]}
            onPress={playPrevious}
            accessibilityLabel="Previous track"
          >
            <Ionicons name="play-skip-back" size={26} color="#ffffff" />
          </TouchableOpacity>

          {/* Play / Pause button */}
          <TouchableOpacity
            style={[styles.playBtn, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter]}
            onPress={togglePlayPause}
            disabled={!currentTrack}
            activeOpacity={0.8}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#ffffff" />
          </TouchableOpacity>

          {/* Next track */}
          <TouchableOpacity
            style={[styles.controlBtn, s.alignItemsCenter, s.justifyContentCenter]}
            onPress={playNext}
            accessibilityLabel="Next track"
          >
            <Ionicons name="play-skip-forward" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ── 6. Secondary Controls Row (shuffle, repeat, like — evenly spaced) ── */}
        <View style={[styles.secondaryControls, s.flexRow, s.alignItemsCenter, s.justifyContentAround, s.w100, s.mb2]}>
          {/* Shuffle button — reflects isShuffled state visually */}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              s.alignItemsCenter,
              s.justifyContentCenter,
              isShuffled && styles.secondaryBtnActive,
            ]}
            onPress={toggleShuffle}
            accessibilityLabel="Toggle shuffle"
          >
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffled ? Colors.primary : '#ffffff'}
            />
          </TouchableOpacity>

          {/* Like / Unlike button */}
          <TouchableOpacity
            style={[styles.secondaryBtn, s.alignItemsCenter, s.justifyContentCenter]}
            onPress={() => currentTrack && toggleLike(currentTrack.id)}
            disabled={!currentTrack}
            accessibilityLabel={isLiked ? 'Unlike track' : 'Like track'}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? Colors.danger : '#ffffff'}
            />
          </TouchableOpacity>

          {/* Repeat button with '1' badge when repeatMode === 'one' */}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              s.alignItemsCenter,
              s.justifyContentCenter,
              repeatMode !== 'off' && styles.secondaryBtnActive,
              { position: 'relative' },
            ]}
            onPress={toggleRepeat}
            accessibilityLabel="Toggle repeat"
          >
            <Ionicons
              name="repeat"
              size={22}
              color={repeatMode !== 'off' ? Colors.primary : '#ffffff'}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 7. Bottom Volume Slider ── */}
      <View style={[styles.volumeRow, s.flexRow, s.alignItemsCenter, s.w100]}>
        <Ionicons name="volume-low-outline" size={20} color="#ffffff" />
        <View style={s.flex1}>
          <Slider
            value={volume}
            onValueChange={setVolume}
            onSlidingComplete={setVolume}
            activeTrackColor={Colors.textMuted}
            trackColor={Colors.border}
            thumbColor={Colors.textMuted}
          />
        </View>
        <Ionicons name="volume-high-outline" size={20} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
  },
  dismissArea: {
    paddingTop: 12,
  },
  dismissLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 260,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  trackInfo: {
    paddingHorizontal: 12,
  },
  trackTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
  progressContainer: {
    width: '100%',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  playbackControls: {
    gap: 28,
  },
  controlBtn: {
    width: 48,
    height: 48,
  },
  playBtn: {
    width: 64,
    height: 64,
    backgroundColor: Colors.primary,
  },
  secondaryControls: {
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  secondaryBtnActive: {
    backgroundColor: 'rgba(13, 110, 253, 0.2)',
    borderRadius: 22,
  },
  repeatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    lineHeight: 10,
  },
  volumeRow: {
    gap: 12,
  },
});
