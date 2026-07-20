**

Title: ADR 03: Hardware 

Status: Proposed

Context: As an offline-first app, we need to access the phone's hardware to play audio, select local MP3s, save them to the app, and read their song details without using the internet.

Decision: We will use native Expo tools and a metadata parser: we will use expo-av to play the MP3s and adjust the volume, expo-document-picker to select the files, expo-file-system to save and read the files on the device, and music-metadata-browser to read the song details directly from the MP3 files. 

Consequences: It becomes easy to guarantee the app works 100% offline with no server needed, keeping all file processing entirely self-contained on the device.

  
**