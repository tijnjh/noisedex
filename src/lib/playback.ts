import { splitPreviewTitle } from "./api/platforms/everynoise-data";
import { atom } from "jotai";

export interface PlaybackTrack {
  title?: string;
  artist?: string;
  artworkSrc?: string;
  url?: string;
}

export const stoppedPlayback: PlaybackTrack = {};

export const nowPlayingAtom = atom<PlaybackTrack>(stoppedPlayback);

/** an itunes track, playing its 30 second preview unless a full `url` is given */
export function itunesPlayback(
  track: { trackName: string; artistName: string; artworkUrl100: string; previewUrl: string },
  url = track.previewUrl,
): PlaybackTrack {
  return { title: track.trackName, artist: track.artistName, artworkSrc: track.artworkUrl100, url };
}

/** the example track everynoise attaches to genres and artists */
export function previewPlayback(preview: { title: string; url: string }): PlaybackTrack {
  return { ...splitPreviewTitle(preview.title), url: preview.url };
}
