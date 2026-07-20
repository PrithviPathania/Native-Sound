**  

Title: ADR 02: Navigation Strategy 

Status: Proposed

Context: We need a way to navigate between the Library, Liked Library, and Upload pages while keeping a music player accessible at all times.

 Decision: We will use Expo Router for standard stack navigation. The music mini-player will be a reusable component placed at the bottom of every page, and the full-screen player will open as a popup (Modal). 

Consequences: The file structure becomes much simpler to build and manage. However, it means the mini-player will animate during screen transitions instead of staying perfectly static at the bottom.

**