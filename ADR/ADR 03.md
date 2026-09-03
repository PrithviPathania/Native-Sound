Title: ADR 03: Hardware 

Status: Accepted

Context: As an offline-first app, we need to access the phone's hardware to play audio, select local MP3s, copy them to persistent app storage, and read their song details without using the internet. 

Decision: We will use native Expo tools and a metadata parser: expo-document-picker to select MP3 files, expo-file-system to copy them to permanent app storage (Paths.document), expo-music-info-2 to read ID3 song details locally, and expo-audio to control playback, seeking, and volume. 

Consequences: Preserves audio files reliably in local app storage, and guarantees the app works 100% offline with zero server dependence.