import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  PanResponder,
  FlatList,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { s } from '../styles/bootstrap';
import { useAudio } from '../context/AudioContext';
import type { Track } from '../types/track';

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
// Queue Item Row with Swipe/Drag-to-Reorder
// ---------------------------------------------------------------------------
interface QueueItemRowProps {
  item: Track;
  index: number;
  totalCount: number;
  isRepeatingCurrent: boolean;
  onPlay: () => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}

function QueueItemRow({
  item,
  index,
  totalCount,
  isRepeatingCurrent,
  onPlay,
  onSwap,
  onRemove,
}: QueueItemRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const hasSwappedRef = useRef(false);

  // Reorder vertical PanResponder (attached to reorder drag handle)
  const reorderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          setDragOffset(0);
          hasSwappedRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          setDragOffset(gestureState.dy);
          const threshold = 28;
          if (!hasSwappedRef.current) {
            if (gestureState.dy < -threshold && index > 0) {
              hasSwappedRef.current = true;
              onSwap(index, index - 1);
            } else if (gestureState.dy > threshold && index < totalCount - 1) {
              hasSwappedRef.current = true;
              onSwap(index, index + 1);
            }
          }
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          setDragOffset(0);
          hasSwappedRef.current = false;
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDragOffset(0);
          hasSwappedRef.current = false;
        },
      }),
    [index, totalCount, onSwap]
  );

  // Swipe left to remove PanResponder (attached to row)
  const swipeRemovePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            gestureState.dx < -10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
          );
        },
        onPanResponderMove: (_, gestureState) => {
          const newX = Math.min(0, gestureState.dx);
          setSwipeX(newX);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -100 || (gestureState.dx < -60 && gestureState.vx < -0.5)) {
            onRemove(index);
          } else {
            setSwipeX(0);
          }
        },
        onPanResponderTerminate: () => {
          setSwipeX(0);
        },
      }),
    [index, onRemove]
  );

  return (
    <View style={[styles.queueItemContainer, s.mb1]}>
      {/* Background delete action revealed on swipe left */}
      <TouchableOpacity
        style={[
          styles.queueItemDeleteBackground,
          s.flexRow,
          s.alignItemsCenter,
          s.justifyContentEnd,
          s.px3,
          { opacity: swipeX < 0 ? 1 : 0 },
        ]}
        onPress={() => onRemove(index)}
        activeOpacity={0.8}
        accessibilityLabel={`Remove ${item.title} from queue`}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.textMuted} style={styles.deleteIcon} />
        <Text style={styles.deleteText}>Remove</Text>
      </TouchableOpacity>

      {/* Foreground queue row */}
      <View
        {...swipeRemovePanResponder.panHandlers}
        style={[
          styles.queueItemRow,
          s.flexRow,
          s.alignItemsCenter,
          s.py2,
          s.px2,
          isDragging && styles.queueItemRowDragging,
          {
            transform: [
              { translateY: clamp(dragOffset, -40, 40) },
              { translateX: swipeX },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[s.flex1, s.flexRow, s.alignItemsCenter]}
          onPress={onPlay}
          activeOpacity={0.7}
          accessibilityLabel={`Play ${item.title}`}
        >
          <View style={[styles.queueIndexBox, s.alignItemsCenter, s.justifyContentCenter]}>
            {isRepeatingCurrent ? (
              <Ionicons name="repeat" size={14} color={Colors.primary} />
            ) : (
              <Text style={styles.queueIndexText}>{index + 1}</Text>
            )}
          </View>

          <View style={[styles.queueItemArt, s.alignItemsCenter, s.justifyContentCenter, s.mr2]}>
            {item.artworkUri ? (
              <Image source={{ uri: item.artworkUri }} style={styles.queueItemArtImage} />
            ) : (
              <Ionicons name="musical-note" size={16} color="#888888" />
            )}
          </View>

          <View style={[s.flex1, s.mr2]}>
            <Text style={[styles.queueItemTitle, s.textWhite]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.queueItemArtist, s.textSecondary]} numberOfLines={1}>
              {item.artist || 'Unknown Artist'}
            </Text>
          </View>

          {item.duration ? (
            <Text style={[styles.queueItemDuration, s.textSecondary, s.mr2]}>
              {formatTime(item.duration)}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Swipe handle to reorder up or down */}
        <View
          {...reorderPanResponder.panHandlers}
          style={styles.reorderHandle}
          accessibilityLabel={`Reorder ${item.title}`}
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="reorder-three-outline"
            size={24}
            color={isDragging ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Player Modal Screen
// ---------------------------------------------------------------------------
export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    playTrack,
    togglePlayPause,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    reorderQueue,
    removeFromQueue,
  } = useAudio();

  const [showQueue, setShowQueue] = useState(false);

  // Smooth entrance/transition animations when toggling queue
  const queueAnim = useRef(new Animated.Value(0)).current;
  const standardAnim = useRef(new Animated.Value(1)).current;
  const isInitialMount = useRef(true);

  // Real-time interactive drag & slide-down dismissal animation
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showQueue) {
      queueAnim.setValue(0);
      Animated.timing(queueAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        standardAnim.setValue(1);
        return;
      }
      standardAnim.setValue(0);
      Animated.timing(standardAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [showQueue, queueAnim, standardAnim]);

  const queueTranslateY = queueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const queueOpacity = queueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const queueScale = queueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const standardOpacity = standardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const standardScale = standardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  // Translucent fade during swipe down so the underlying screen is revealed
  const modalOpacity = modalTranslateY.interpolate({
    inputRange: [0, 60, 200, 600],
    outputRange: [1, 0.94, 0.76, 0.1],
    extrapolate: 'clamp',
  });

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

  const dismissPlayer = useCallback(() => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
    } else if (typeof (router as any).dismiss === 'function') {
      try {
        (router as any).dismiss();
      } catch {
        router.back();
      }
    } else if (typeof (router as any).navigate === 'function') {
      (router as any).navigate('/(tabs)');
    } else {
      router.back();
    }
  }, [router]);

  const isDismissingRef = useRef(false);

  const handleDismissWithAnimation = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    if (process.env.NODE_ENV === 'test') {
      dismissPlayer();
      return;
    }
    Animated.timing(modalTranslateY, {
      toValue: 900,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      dismissPlayer();
    });
  }, [modalTranslateY, dismissPlayer]);

  // Swipe-to-dismiss gesture responder with real-time drag follow and smooth slide-down
  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60 || gestureState.vy > 0.4) {
          handleDismissWithAnimation();
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(modalTranslateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
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

  const getQueueSubtitle = () => {
    if (repeatMode === 'one') return 'Repeating current track';
    if (isShuffled && repeatMode === 'all') return 'Shuffled & looping';
    if (isShuffled) return 'Shuffled order';
    if (repeatMode === 'all') return 'Looping all tracks';
    return 'Playing in order';
  };

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => {
    const isRepeatingCurrent = repeatMode === 'one' && index === 0 && item.id === currentTrack?.id;

    return (
      <QueueItemRow
        item={item}
        index={index}
        totalCount={queue.length}
        isRepeatingCurrent={isRepeatingCurrent}
        onPlay={() => playTrack(item)}
        onSwap={(fromIdx, toIdx) => reorderQueue(fromIdx, toIdx)}
        onRemove={(idx) => removeFromQueue(idx)}
      />
    );
  };

  const renderEmptyQueue = () => (
    <View style={[styles.emptyQueueContainer, s.alignItemsCenter, s.justifyContentCenter, s.py4]}>
      <Ionicons name="file-tray-outline" size={32} color={Colors.textMuted} />
      <Text style={[styles.emptyQueueTitle, s.textWhite, s.mt2]}>End of Queue</Text>
      <Text style={[styles.emptyQueueSubtext, s.textSecondary, s.mt1]}>
        Enable Repeat to loop, or add more songs to your library.
      </Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        s.flex1,
        s.flexColumn,
        s.justifyContentBetween,
        s.px3,
        s.pb4,
        {
          opacity: modalOpacity,
          transform: [{ translateY: modalTranslateY }],
        },
      ]}
    >
      {/* ── 1. Dismiss Chevron / Header at top ── */}
      <View
        style={[styles.dismissArea, s.alignItemsCenter, s.py2, s.mb2]}
        {...swipePanResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handleDismissWithAnimation}
          activeOpacity={0.6}
          accessibilityLabel="Close player"
          style={s.alignItemsCenter}
        >
          <Ionicons name="chevron-down" size={24} color="#ffffff" />
          <Text style={[styles.dismissLabel, s.textSecondary]}>Player</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Middle Content Area (Switches between standard and queue views) ── */}
      {showQueue ? (
        <Animated.View
          style={[
            s.flex1,
            s.flexColumn,
            s.w100,
            s.mb2,
            {
              opacity: queueOpacity,
              transform: [{ translateY: queueTranslateY }, { scale: queueScale }],
            },
          ]}
        >
          {/* Minimized Now Playing Bar */}
          <View
            style={[styles.minimizedHeader, s.flexRow, s.alignItemsCenter, s.w100, s.mb2]}
            {...swipePanResponder.panHandlers}
          >
            <View style={[styles.minimizedArt, s.alignItemsCenter, s.justifyContentCenter]}>
              {currentTrack?.artworkUri ? (
                <Image source={{ uri: currentTrack.artworkUri }} style={styles.minimizedArtImage} />
              ) : (
                <Ionicons name="musical-notes" size={20} color="#ffffff" />
              )}
            </View>
            <View style={s.flex1}>
              <Text style={[styles.minimizedTitle, s.textWhite]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.minimizedArtist, s.textSecondary]} numberOfLines={1}>
                {artist}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.minimizedLikeBtn, s.p1]}
              onPress={() => currentTrack && toggleLike(currentTrack.id)}
              disabled={!currentTrack}
              accessibilityLabel={isLiked ? 'Unlike track' : 'Like track'}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? Colors.danger : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          {/* Section Header: Up Next + count + mode */}
          <View style={[styles.queueSectionHeader, s.flexRow, s.justifyContentBetween, s.alignItemsCenter, s.w100, s.px1, s.mb2]}>
            <View>
              <Text style={styles.queueSectionTitle}>Up Next</Text>
              <Text style={styles.queueSectionSubtitle}>{getQueueSubtitle()}</Text>
            </View>
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>
                {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
              </Text>
            </View>
          </View>

          {/* Scrollable Queue List */}
          <View style={[styles.queueListContainer, s.flex1, s.w100]}>
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderQueueItem}
              ListEmptyComponent={renderEmptyQueue}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={queue.length === 0 ? { flex: 1, justifyContent: 'center' } : { padding: 4 }}
            />
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            s.flex1,
            s.flexColumn,
            s.justifyContentCenter,
            s.alignItemsCenter,
            s.w100,
            {
              opacity: standardOpacity,
              transform: [{ scale: standardScale }],
            },
          ]}
          {...swipePanResponder.panHandlers}
        >
          {/* Standard View: Large Album Art */}
          <View style={[styles.albumArt, s.alignItemsCenter, s.justifyContentCenter, s.alignSelfCenter]}>
            {currentTrack?.artworkUri ? (
              <Image source={{ uri: currentTrack.artworkUri }} style={styles.albumArtImage} />
            ) : (
              <Ionicons name="musical-notes" size={72} color="#ffffff" />
            )}
          </View>

          {/* Standard View: Track Title + Artist */}
          <View style={[styles.trackInfo, s.alignItemsCenter, s.w100]}>
            <Text style={[styles.trackTitle, s.textWhite, { textAlign: 'center' }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.trackArtist, s.textSecondary, { textAlign: 'center' }]}>{artist}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── 3. Bottom Controls Area (Always anchored at bottom in both views) ── */}
      <View style={[styles.bottomSection, s.w100]}>
        {/* Progress Slider with Time Labels */}
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

        {/* Playback Controls Row (previous, play/pause, next) */}
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

        {/* Secondary Controls Row (shuffle, like, repeat, queue) */}
        <View style={[styles.secondaryControls, s.flexRow, s.alignItemsCenter, s.justifyContentAround, s.w100, s.mb2]}>
          {/* Shuffle button */}
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

          {/* Queue toggle button */}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              s.alignItemsCenter,
              s.justifyContentCenter,
              showQueue && styles.secondaryBtnActive,
            ]}
            onPress={() => setShowQueue((prev) => !prev)}
            accessibilityLabel="Toggle queue"
          >
            <Ionicons
              name="list"
              size={22}
              color={showQueue ? Colors.primary : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Volume Slider */}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    paddingTop: 36,
  },
  dismissArea: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 12,
  },
  dismissLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  albumArt: {
    width: '88%',
    aspectRatio: 1,
    maxHeight: 280,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 36,
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
  },
  trackInfo: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  trackTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
  // Minimized Header Styles in Queue View
  minimizedHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  minimizedArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    marginRight: 16,
  },
  minimizedArtImage: {
    width: '100%',
    height: '100%',
  },
  minimizedTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 3,
  },
  minimizedArtist: {
    fontSize: 13,
    fontFamily: 'Inter',
  },
  minimizedLikeBtn: {
    padding: 6,
  },
  // Queue Section Header
  queueSectionHeader: {
    marginTop: 4,
  },
  queueSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#ffffff',
  },
  queueSectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginTop: 2,
  },
  queueBadge: {
    backgroundColor: 'rgba(13, 110, 253, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 110, 253, 0.3)',
  },
  queueBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  // Queue List Styles
  queueListContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  queueItemContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  queueItemDeleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deleteIcon: {
    marginRight: 6,
  },
  deleteText: {
    color: Colors.textMuted,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 13,
  },
  queueItemRow: {
    backgroundColor: '#222222',
    borderRadius: 8,
    position: 'relative',
  },
  queueItemRowDragging: {
    backgroundColor: 'rgba(13, 110, 253, 0.22)',
    borderColor: 'rgba(13, 110, 253, 0.5)',
    borderWidth: 1,
    zIndex: 99,
  },
  reorderHandle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueIndexBox: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  queueIndexText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  queueItemArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    marginRight: 12,
  },
  queueItemArtImage: {
    width: '100%',
    height: '100%',
  },
  queueItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    marginBottom: 2,
  },
  queueItemArtist: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  queueItemDuration: {
    fontSize: 12,
    fontFamily: 'Inter',
  },
  emptyQueueContainer: {
    padding: 24,
  },
  emptyQueueTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  emptyQueueSubtext: {
    fontSize: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  // Bottom Controls Section
  bottomSection: {
    paddingTop: 4,
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
    paddingHorizontal: 16,
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
