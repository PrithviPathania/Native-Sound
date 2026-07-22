---
name: Native Sound
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#191b24'
  surface-container: '#1d1f28'
  surface-container-high: '#272a33'
  surface-container-highest: '#32343e'
  on-surface: '#e1e2ee'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#e1e2ee'
  inverse-on-surface: '#2d3039'
  outline: '#8c90a1'
  outline-variant: '#424655'
  surface-tint: '#b1c5ff'
  primary: '#b1c5ff'
  on-primary: '#002c70'
  primary-container: '#0d6efd'
  on-primary-container: '#ffffff'
  inverse-primary: '#0057ce'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b6b5b4'
  tertiary: '#77da9f'
  on-tertiary: '#00391f'
  tertiary-container: '#198754'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#93f7ba'
  tertiary-fixed-dim: '#77da9f'
  on-tertiary-fixed: '#002110'
  on-tertiary-fixed-variant: '#00522f'
  background: '#10131b'
  on-background: '#e1e2ee'
  surface-variant: '#32343e'
typography:
  display-sm:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-xs:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  edge-margin: 16px
  gutter: 12px
---

## Brand & Style
The design system focuses on a high-utility, performance-driven mobile experience for audiophiles and casual listeners alike. The brand personality is functional, reliable, and "native"—prioritizing content (music) over decorative flair. 

The aesthetic blends **Modern Corporate** efficiency with **Bootstrap-inspired** UI patterns. It utilizes a deep-dark canvas to allow album art to provide the primary visual vibrance, while UI controls remain grounded in familiar, accessible patterns. The emotional response is one of trust and immediate usability, reminiscent of a high-end system utility rather than a flashy social app.

## Colors
The palette is rooted in a deep "True Dark" background (`#121212`) to preserve battery life on OLED screens and minimize glare. 

- **Primary Blue**: Used for active states, primary action buttons, and progress bar fills.
- **Secondary/Surface**: A neutral dark gray used for card backgrounds and container strokes to separate content from the deep background.
- **Success Green**: Reserved for "Downloaded" statuses and active "Now Playing" indicators in lists.
- **Danger Red**: Strictly used for the "Liked" heart icon and destructive actions.
- **Typography**: High-contrast white for headers and muted gray for metadata (artist names, durations) to establish a clear hierarchy.

## Typography
The system uses **Inter** for its exceptional legibility at small sizes and its neutral, systematic feel. 

- **Weight usage**: Use Bold (700) and SemiBold (600) for track titles and section headers. Regular (400) is reserved for artist names and descriptions.
- **Scale**: The hierarchy is tight. Information density is prioritized, especially in track lists where metadata must remain legible despite the compact layout.
- **Letter Spacing**: Headlines use slight negative tracking for a "tighter" feel, while labels use increased tracking to ensure readability at very small scales.

## Layout & Spacing
This design system utilizes a **Fluid Flexbox** model tailored for mobile viewports. 

- **Safe Zones**: Maintain a 16px horizontal margin for all primary content.
- **Grid**: While primarily vertical, 2-column grids are used for album browsing on larger mobile screens with a 12px gutter.
- **Density**: The "Compact Flex" approach means vertical spacing between track items in a list should be exactly 8px to maximize the number of visible items on screen without sacrificing touch targets (minimum 44px height).
- **Fixed Elements**: The mini-player is pinned to the bottom of the viewport, sitting directly above the global navigation bar.

## Elevation & Depth
In a dark interface, depth is communicated through **Tonal Layering** and subtle borders rather than heavy shadows.

- **Level 0 (Background)**: `#121212` for the main canvas.
- **Level 1 (Cards/Mini-player)**: `#1e1e1e` with a 1px solid border of `#2c2c2c`.
- **Level 2 (Modals/Overlays)**: `#252525` with a subtle 0%–10% opacity white inner-glow on the top edge.
- **Interaction**: Pressing a list item should trigger a subtle background color shift to `#2c2c2c` (Bootstrap-style hover/active state).

## Shapes
The design system follows a consistent "Soft Corner" philosophy. 

- **Primary Radius**: 8px (`rounded-md`) for standard track thumbnails, buttons, and utility cards.
- **Large Radius**: 12px (`rounded-lg`) for the full-screen player's album art and main container modals.
- **Buttons**: Use 8px radius for standard actions. Round "Pill" shapes are reserved exclusively for the "Play" and "Shuffle" floating action buttons.

## Components

### Buttons
- **Primary**: Solid `#0d6efd` background with white text. 8px border radius.
- **Outline**: 1px `#2c2c2c` border with white text. Used for secondary actions like "Edit Playlist."
- **Icon Buttons**: No background by default; use Primary Blue or Danger Red for toggled active states (e.g., Shuffle, Like).

### Track Lists
- **Structure**: 48px album art (8px radius), followed by a vertical flex column for Title (White) and Artist (Gray). 
- **Trailing Element**: A "three-dot" vertical menu icon or a "Liked" heart icon.
- **Active State**: The currently playing track should have its Title colored in Primary Blue with a small "Equalizer" animation icon.

### Mini-player
- A persistent 64px tall bar pinned to the bottom. 
- Features a small 40px thumbnail, track info, and a play/pause toggle. 
- Include a 2px height progress bar at the very top of this component using the Primary Blue color.

### Utility Cards
- Used for "Import Music" or "Storage" info. 
- Background: `#1e1e1e`. 
- Border: 1px `#2c2c2c`. 
- Padding: 16px.

### Inputs & Selection
- **Checkboxes**: Use the Bootstrap-standard square with 4px radius, filling with Primary Blue when checked.
- **Progress Sliders**: 4px height track in `#2c2c2c` with a Primary Blue fill. The "thumb" (handle) should only appear during active dragging.