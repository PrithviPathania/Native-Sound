import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../../constants/theme';
import { s } from '../../styles/bootstrap';
import { importAudioFiles } from '../../services/fileImporter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ImportPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [importing, setImporting] = useState(false);

  const handleBackToLibrary = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (typeof (router as any).navigate === 'function') {
      (router as any).navigate('/(tabs)/');
    } else {
      router.replace('/(tabs)/');
    }
  };

  const handleBrowse = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const tracks = await importAudioFiles();
      if (tracks.length > 0) {
        const message =
          tracks.length === 1
            ? `"${tracks[0].title}" has been added to your library.`
            : `Successfully imported ${tracks.length} tracks to your library.`;

        Alert.alert('✅ Import Successful', message, [
          {
            text: 'Go to Library',
            onPress: () => router.replace('/(tabs)/'),
          },
        ]);
      }
    } catch (err) {
      console.error('[Import] Error importing files:', err);
      Alert.alert('Import Failed', 'Something went wrong while importing your audio file(s).');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, s.flex1, s.bgDark, s.px3, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Back to Library CTA Box */}
      <TouchableOpacity
        style={[styles.libraryCard, s.flexRow, s.alignItemsCenter]}
        activeOpacity={0.7}
        onPress={handleBackToLibrary}
        accessibilityLabel="Back to Library"
      >
        <View style={[styles.libraryIconContainer, s.roundedCircle, s.alignItemsCenter, s.justifyContentCenter]}>
          <Ionicons name="chevron-back" size={16} color="#ffffff" />
        </View>
        <Text style={[styles.libraryCardTitle, s.textWhite]}>Library</Text>
      </TouchableOpacity>

      {/* Page header */}
      <Text style={[styles.pageTitle, s.textWhite, s.mt1, s.mb1]}>Import Music</Text>
      <Text style={[styles.pageSubtitle, s.textSecondary, s.mb4]}>
        Add audio files from your device storage
      </Text>

      {/* Drop zone / import card with dashed border */}
      <View style={styles.dropZone}>
        <View style={[styles.dropZoneInner, s.alignItemsCenter, s.justifyContentCenter]}>
          <Ionicons
            name={importing ? 'sync' : 'folder-open'}
            size={48}
            color="#ffffff"
            style={styles.dropIcon}
          />
          <Text style={[styles.dropTitle, s.textWhite, s.mb1]}>
            {importing ? 'Importing…' : 'Select a File'}
          </Text>
          <Text style={[styles.dropSubtitle, s.textSecondary, s.mb4]}>
            Only mp3 files are supported
          </Text>

          {/* Browse CTA — Bootstrap btn-primary pattern with unclipped glow shadow */}
          <TouchableOpacity
            style={[
              styles.browseButton,
              s.alignItemsCenter,
              s.justifyContentCenter,
              importing && styles.browseButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleBrowse}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.browseButtonText, s.textWhite]}>Browse Local Storage</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Info helper section */}
      <View style={[styles.infoSection, s.py3]}>
        <Text style={[styles.infoText, s.textSecondary]}>
          Selected files are copied into the app for permanent offline playback.
          Metadata such as title, artist, album, and artwork are extracted automatically.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    overflow: 'visible',
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
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },

  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
  },

  dropZone: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.large,
    padding: 4,
    minHeight: 320,
    marginBottom: 24,
    overflow: 'visible',
  },

  dropZoneInner: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.standard,
    padding: 24,
    flex: 1,
    overflow: 'visible',
  },

  dropIcon: {
    marginBottom: 12,
  },

  dropTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },

  dropSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter',
  },

  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    minHeight: 48,
    minWidth: 220,
    borderRadius: Radii.standard,
    overflow: 'visible',

    // Cross-platform shadow surrounding the entire button
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,

    marginVertical: 8,
  },

  browseButtonDisabled: {
    backgroundColor: 'rgba(13, 110, 253, 0.5)',
    shadowOpacity: 0.2,
    elevation: 2,
  },

  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },

  infoSection: {},

  infoText: {
    fontSize: 13,
    fontFamily: 'Inter',
    lineHeight: 20,
    textAlign: 'center',
  },
});