**

Title: ADR 04: Database Storage 

Status: Proposed

Context: The app needs an offline way to remember where imported MP3 files are saved on the phone, their song details, and whether a user has "liked" them. 

Decision: We will use Expo SQLite to create and manage a local database directly on the phone. 

Consequences: It becomes very easy to instantly update the UI (like viewing the Liked Library) by asking the local database to filter and show specific songs, running with zero internet dependence

  
  
  
  
  
**