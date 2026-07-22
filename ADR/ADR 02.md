Title: ADR 02: Navigation Strategy 

Status: Proposed 

Context: We need a way to navigate from the main library page into sub-pages (like Liked Library and Upload) using stack navigation with back buttons, while always keeping a music mini player accessible without UI glitching or re-rendering during transitions. 

Decision: We will use Expo Router for standard stack navigation, mounting the mini-player component directly inside the persistent Root Layout wrapper (app/_layout.tsx) beneath the <Stack/>, and opening the full-screen player as a global Modal route. 

Consequences: The mini-player stays perfectly static at the bottom of the screen while sub-pages slide in and out above it, keeping global playback active across all screens and eliminating transition animation glitches. 