import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  PanResponder,
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
  onValueChange?: (v: number) => void;
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

  const trackWidthRef = useRef(1);
  const slidingRef = useRef(false);
  const slideValueRef = useRef(value);
  const startValRef = useRef(0);
  const onValueChangeRef = useRef(onValueChange);
  const onSlidingCompleteRef = useRef(onSlidingComplete);
  const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
    onSlidingCompleteRef.current = onSlidingComplete;
  });

  // When not actively dragging, keep slideValue synced with external value
  useEffect(() => {
    if (!slidingRef.current) {
      setSlideValue(value);
      slideValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
      }
    };
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
          }
          slidingRef.current = true;
          setSliding(true);

          const w = Math.max(1, trackWidthRef.current);
          const locX = clamp(evt.nativeEvent.locationX, 0, w);
          const initialVal = clamp(locX / w, 0, 1);

          startValRef.current = initialVal;
          slideValueRef.current = initialVal;
          setSlideValue(initialVal);
          onValueChangeRef.current?.(initialVal);
        },
        onPanResponderMove: (_, gestureState) => {
          const w = Math.max(1, trackWidthRef.current);
          const nextVal = clamp(startValRef.current + gestureState.dx / w, 0, 1);
          slideValueRef.current = nextVal;
          setSlideValue(nextVal);
          onValueChangeRef.current?.(nextVal);
        },
        onPanResponderRelease: () => {
          const finalVal = slideValueRef.current;
          onSlidingCompleteRef.current?.(finalVal);

          // Delay clearing sliding state to prevent visual snap-back while player seeks
          releaseTimeoutRef.current = setTimeout(() => {
            slidingRef.current = false;
            setSliding(false);
          }, 300);
        },
        onPanResponderTerminate: () => {
          slidingRef.current = false;
          setSliding(false);
        },
      }),
    []
  );

  const displayValue = sliding ? slideValue : value;

  return (
    <View
      style={sliderStyles.trackContainer}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) {
          setTrackWidth(w);
          trackWidthRef.current = w;
        }
      }}
      hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
      {...panResponder.panHandlers}
    >
      <View
        pointerEvents="none"
        style={[sliderStyles.trackBg, { backgroundColor: trackColor }]}
      />
      <View
        pointerEvents="none"
        style={[
          sliderStyles.trackFill,
          { width: `${clamp(displayValue, 0, 1) * 100}%`, backgroundColor: activeTrackColor },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          sliderStyles.thumb,
          { left: `${clamp(displayValue, 0, 1) * 100}%`, backgroundColor: thumbColor },
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

  const [scrubRatio, setScrubRatio] = useState<number | null>(null);

  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - currentTime) : 0;

  const displayedTime =
    scrubRatio !== null && duration > 0 ? scrubRatio * duration : currentTime;
  const displayedRemaining =
    scrubRatio !== null && duration > 0
      ? Math.max(0, duration - displayedTime)
      : remaining;

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
      setScrubRatio(null);
      if (duration > 0 && !isNaN(normalised)) {
        const targetSeconds = Math.max(0, Math.min(duration, normalised * duration));
        seekTo(targetSeconds);
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
            onValueChange={(ratio) => setScrubRatio(ratio)}
            onSlidingComplete={handleProgressComplete}
            activeTrackColor={Colors.primary}
            trackColor={Colors.border}
            thumbColor={Colors.primary}
          />
          <View style={[s.flexRow, s.justifyContentBetween, s.alignItemsCenter, s.mt1]}>
            <Text style={[styles.timeText, s.textSecondary]}>{formatTime(displayedTime)}</Text>
            <Text style={[styles.timeText, s.textSecondary]}>-{formatTime(displayedRemaining)}</Text>
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
