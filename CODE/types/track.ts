// Core Track data model for Native Sound.
// This interface is the single source of truth used across
// the database, audio engine, hooks, and UI layers.

export interface Track {
  id: number;
  uri: string;             // Permanent URI inside app storage
  fileUri?: string;        // Alias for uri (backwards compatibility)
  title: string;
  artist: string;
  album?: string;
  duration?: number;        // Duration in seconds
  artworkUri?: string;     // Local URI or base64 data URI for artwork
  liked: boolean;          // Is favorite / liked
  isLiked?: boolean;       // Alias for liked (backwards compatibility)
  dateAdded?: string;      // Date string when track was added
}
