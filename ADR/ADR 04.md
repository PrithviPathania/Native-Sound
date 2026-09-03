Title: ADR 04: Database Storage 

Status: Accepted

Context: The app needs an offline, local (unencrypted) storage strategy to remember where imported MP3 files are saved on the phone, their song details, liked status, and track durations. 

Decision: We will use local unencrypted storage with Expo SQLite (WAL mode) to create and manage the relational song database, alongside React Context (`AudioContext`) to manage global in-memory playback state (active track, progress, volume, shuffle, repeat). 

Consequences: Structured querying and library updates remain fast, organized, and crash-proof without requiring a secondary key-value storage library or remote servers, keeping the entire storage pipeline unified and 100% offline.