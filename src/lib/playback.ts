import { atom } from "jotai";

export interface PlaybackTrack {
  title: string | undefined;
  url: string | undefined;
}

export const stoppedPlayback: PlaybackTrack = {
  title: undefined,
  url: undefined,
};

export const nowPlayingAtom = atom<PlaybackTrack>(stoppedPlayback);
