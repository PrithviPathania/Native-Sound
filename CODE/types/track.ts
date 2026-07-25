// Core Track data model for Native Sound.
// This interface is the single source of truth used across
// the database, audio engine, and UI layers.

export interface Track {
  id: number;
  title: string;
  artist: string;
  fileUri: string;          // Permanent URI inside documentDirectory
  duration?: number;        // Duration in seconds (optional — extracted from ID3)
  isLiked: boolean;
}
