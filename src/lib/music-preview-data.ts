import type { SpotifyTrack } from "./api/platforms/spotify-data.ts";

export interface MusicPreview {
  name: string;
  artist: string;
  durationMs: number;
  explicit: boolean;
  url: string;
}
export const normalizeMusicName = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase();
export function matchMusicPreview(
  track: SpotifyTrack,
  previews: MusicPreview[],
) {
  return previews.find(
    (preview) =>
      normalizeMusicName(preview.name) === normalizeMusicName(track.name) &&
      track.artists.some(
        (artist) =>
          normalizeMusicName(artist.name) ===
          normalizeMusicName(preview.artist),
      ) &&
      Math.abs(preview.durationMs - track.duration_ms) <= 2000 &&
      preview.explicit === track.explicit,
  )?.url;
}
