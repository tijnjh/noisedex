import { atom } from "jotai";

export interface PlaybackTrack {
  title: string | undefined;
  url: string | undefined;
}

export const nowPlayingAtom = atom<PlaybackTrack>({
  title: undefined,
  url: undefined,
});
