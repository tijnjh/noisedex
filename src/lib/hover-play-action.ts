import { PlayingPrefix } from "#components/play-button";
import { usePopover } from "#hooks/use-popover";
import { playOnHoverAtom } from "#lib/atoms";
import { nowPlayingAtom, stoppedPlayback, type PlaybackTrack } from "#lib/playback";
import { useAtomValue, useSetAtom } from "jotai";
import { createElement, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

const sampleTrack: PlaybackTrack = { title: "A track title", artist: "An artist" };

export function useHoverPlayAction(
  load: () => PlaybackTrack | undefined | Promise<PlaybackTrack | undefined>,
  popover?: ReactNode | ((playing: PlaybackTrack) => ReactNode),
): HTMLAttributes<HTMLElement> {
  const playOnHover = useAtomValue(playOnHoverAtom);
  const setNowPlaying = useSetAtom(nowPlayingAtom);
  const [playing, setPlaying] = useState<PlaybackTrack>();
  const [loading, setLoading] = useState(false);

  const card =
    typeof popover === "function"
      ? playing || loading
        ? popover(playing ?? sampleTrack)
        : undefined
      : popover;
  const popoverProps = usePopover(
    (playing || loading) && card != null ? createElement(PlayingPrefix, { loading }, card) : card,
  );

  // the hover in progress, so a track that loads after the pointer left never starts
  const hover = useRef<{ url?: string }>(undefined);

  return {
    ...popoverProps,
    onMouseEnter(event) {
      popoverProps.onMouseEnter?.(event);
      if (!playOnHover) return;

      const current: { url?: string } = (hover.current = {});
      const track = load();
      if (track instanceof Promise) setLoading(true);

      void Promise.resolve(track).then((track) => {
        if (hover.current !== current) return;
        setLoading(false);
        if (!track?.url) return;

        current.url = track.url;
        setNowPlaying(track);
        setPlaying(track);
      });
    },
    onMouseLeave(event) {
      popoverProps.onMouseLeave?.(event);
      const url = hover.current?.url;
      hover.current = undefined;
      setPlaying(undefined);
      setLoading(false);

      if (url) setNowPlaying((playing) => (playing.url === url ? stoppedPlayback : playing));
    },
  };
}
