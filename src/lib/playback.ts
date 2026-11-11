import { atom } from "jotai";

export interface PlaybackTrack {
  title: string | undefined;
  artist: string | undefined;
  artworkSrc: string | undefined;
  url: string | undefined;
}

export const stoppedPlayback: PlaybackTrack = {
  title: undefined,
  artist: undefined,
  artworkSrc: undefined,
  url: undefined,
};

export const nowPlayingAtom = atom<PlaybackTrack>(stoppedPlayback);
