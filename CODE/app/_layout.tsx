import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Colors } from '../constants/theme';
import MiniPlayer from '../components/MiniPlayer';
import { AudioProvider } from '../context/AudioContext';
import { initDatabase } from '../services/database';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialise the SQLite database once when the app boots.
  useEffect(() => {
    initDatabase().catch((err) =>
      console.error('[RootLayout] DB init failed:', err)
    );
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    // AudioProvider wraps the entire tree so every screen and
    // MiniPlayer share the same playback state.
    <AudioProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        {/* MiniPlayer lives OUTSIDE the Stack so it persists across
            all screen transitions without unmounting/remounting. */}
        <MiniPlayer />
      </View>
    </AudioProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
