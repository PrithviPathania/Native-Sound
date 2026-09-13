import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import MiniPlayer from '../components/MiniPlayer';
import { AudioProvider } from '../context/AudioContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { initDatabase } from '../services/database';

function AppContent() {
  const pathname = usePathname();
  const { colors } = useTheme();

  // Check if player modal route is currently open to prevent duplicate UI
  const isPlayerOpen = pathname === '/player' || pathname?.includes('/player');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="player"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>

      {/* MiniPlayer lives OUTSIDE the Stack so it persists across
          all tab transitions, but is hidden when full player modal is open. */}
      {!isPlayerOpen && <MiniPlayer />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'A Box For': require('../assets/fonts/A Box For.ttf'),
    'A Box For 2': require('../assets/fonts/A Box For 2.ttf'),
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
    <ThemeProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
