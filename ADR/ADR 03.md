Title: ADR 03: Hardware 

Status: Proposed 

Context: As an offline-first app, we need to access the phone's hardware to play audio, select local MP3s, save them permanently to the app, and read their song details without using the internet. 

Decision: We will use native Expo tools and a metadata parser: expo-document-picker to select MP3 files, expo-file-system to copy them to permanent app storage (FileSystem.documentDirectory), expo-music-info-2 to read ID3 song details locally, and expo-audio to control playback and volume. 

Consequences: Preserves audio files permanently in local storage, and guarantees the app works 100% offline with zero server dependence.