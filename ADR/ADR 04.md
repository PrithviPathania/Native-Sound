Title: ADR 04: Database Storage 

Status: Proposed 

Context: The app needs an offline, local (unencrypted) storage strategy to remember where imported MP3 files are saved on the phone, their song details, liked status, and playback state like song position. 

Decision: We will use local unencrypted storage with Expo SQLite to create and manage the song database, alongside AsyncStorage to persist simple key-value state like active track ID and timestamp. 

Consequences: Structured querying remains fast and organized without forcing continuous database writes during playback, allowing instant UI updates and seamless playback restoration with no remote server or encryption. 