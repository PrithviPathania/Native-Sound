// Type declarations for packages that don't ship their own types


declare module 'expo-music-info-2' {
  interface MusicInfo {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    picture?: {
      pictureData: string;
      pictureDataType: string;
    };
  }

  interface MusicInfoOptions {
    title?: boolean;
    artist?: boolean;
    album?: boolean;
    duration?: boolean;
    picture?: boolean;
  }

  export function getMusicInfoAsync(
    fileUri: string,
    options?: MusicInfoOptions
  ): Promise<MusicInfo | null>;
}
