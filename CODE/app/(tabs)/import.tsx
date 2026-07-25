import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii } from '../../constants/theme';
import { importAudioFile } from '../../services/fileImporter';

export default function ImportPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  const handleBrowse = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const track = await importAudioFile();
      if (track) {
        Alert.alert(
          '✅ Import Successful',
          `"${track.title}" has been added to your library.`,
          [{ text: 'Go to Library', onPress: () => router.back() }]
        );
      }
      // If track is null the user cancelled — do nothing.
    } catch (err) {
      console.error('[Import] importAudioFile error:', err);
      Alert.alert('Import Failed', 'Something went wrong while importing the file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Library</Text>
      </TouchableOpacity>

      {/* Page title */}
      <Text style={styles.pageTitle}>Import Music</Text>
      <Text style={styles.pageSubtitle}>
        Add audio files from your device storage
      </Text>

      {/* Drop zone / import area */}
      <View style={styles.dropZone}>
        <View style={styles.dropZoneInner}>
          <Text style={styles.dropIcon}>{importing ? '⏳' : '📂'}</Text>
          <Text style={styles.dropTitle}>
            {importing ? 'Importing…' : 'Select a File'}
          </Text>
          <Text style={styles.dropSubtitle}>Supported formats: mp3, m4a, flac, wav</Text>

          {/* Browse CTA */}
          <TouchableOpacity
            style={[styles.browseButton, importing && styles.browseButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleBrowse}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.browseButtonText}>Browse Local Storage</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Info footer */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Selected files are copied into the app for permanent offline playback.
          Metadata such as title and artist will be refined in a future update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backArrow: { fontSize: 20, color: Colors.primary, marginRight: 6 },
  backText: { fontSize: 16, fontFamily: 'Inter', color: Colors.primary },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginBottom: 32,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.large,
    padding: 4,
    flex: 1,
    maxHeight: 320,
  },
  dropZoneInner: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.standard,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dropIcon: { fontSize: 48, marginBottom: 16 },
  dropTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  dropSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radii.standard,
    minWidth: 200,
    alignItems: 'center',
  },
  browseButtonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  browseButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '600',
  },
  infoSection: { paddingVertical: 24 },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
