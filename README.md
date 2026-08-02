# Native Sound

A dark-themed, offline music player built with React Native and Expo. Import MP3s from your device, organize your library, like your favorite tracks, and enjoy playback with shuffle, repeat, and background audio support — all without ads or internet access.

---

## App Guide

### Library Page (Home)

| CTA / Element | What It Does |
|---------------|--------------|
| **📥 Import Songs** | Opens the Import page to add MP3s from your device |
| **❤️ Liked Songs** | Opens the Liked Songs page showing all favorited tracks |
| **▶️ Play All** | Plays the first track in your library sequentially and opens the player |
| **🔀 Shuffle All** | Picks a random track, enables shuffle mode, and opens the player |
| **Track row** (tap) | Plays that track and opens the player modal |
| **❤ Heart** (on track row) | Toggles like/unlike. Red = liked, gray = not liked |
| **Pull down** | Refreshes the track list from storage |

---

### Import Page

| CTA / Element | What It Does |
|---------------|--------------|
| **← Library** | Returns to the Library page |
| **Browse Local Storage** | Opens your device's file picker to select one or more MP3s |

**Flow:** Tap Browse Local Storage → pick MP3s → files copy to app storage → metadata extracted → tracks appear in library → confirmation with option to go to Library.

---

### Player Modal

| CTA / Element | What It Does |
|---------------|--------------|
| **Swipe down** | Dismisses the player, song keeps playing |
| **Album art** | Embedded artwork or music note placeholder |
| **Track title** | Current song title |
| **Artist name** | Current artist name |
| **Progress slider** | Drag to seek to any position |
| **Elapsed time** (left) | Current position (mm:ss) |
| **Remaining time** (right) | Time remaining (mm:ss) |
| **⏮ Previous** | Skips to the previous track |
| **▶ / ⏸ Play/Pause** | Toggles playback, white icon on blue circle |
| **⏭ Next** | Skips to the next track |
| **🔀 Shuffle** | Toggles shuffle. Blue = on, gray = off |
| **🔁 Repeat** | Cycles: off → repeat all → repeat one. Blue = active, "1" = repeat one |
| **❤ Heart** | Likes/unlikes current track. Red = liked |
| **Volume slider** | Adjusts playback volume |

---

### MiniPlayer (Bottom Bar)

| CTA / Element | What It Does |
|---------------|--------------|
| **Artwork thumbnail** | 40x40px album art or placeholder |
| **Track info** (tap) | Opens the full player modal |
| **▶ / ⏸ Play/Pause** | Toggles playback |
| **Progress bar** | Thin blue line showing playback progress |

Appears when a track is loaded. Hidden when the full player modal is open.

---

### Liked Songs Page

| CTA / Element | What It Does |
|---------------|--------------|
| **← Library** | Returns to the Library page |
| **Track row** (tap) | Plays that track and opens the player |
| **❤ Heart** (on track row) | Unlikes the track, removing it from this list |

---

### General Behaviors

| Feature | Description |
|---------|-------------|
| **Background playback** | Music plays when app is in background or screen is locked |
| **Cross-screen playback** | Music continues uninterrupted when navigating between screens |
| **Offline first** | All tracks stored locally on device, no internet needed |
| **Data persistence** | Library, likes, and playback state survive app restarts |
| **Shuffle** | Random order, no repeats until all tracks played |
| **Repeat all** | Loops entire library continuously |
| **Repeat one** | Repeats current song indefinitely |
