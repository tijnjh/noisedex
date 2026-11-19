import { usePopover } from "#hooks/use-popover";
import { nowPlayingAtom, playOnHoverAtom, type PlaybackTrack } from "#lib/playback";
import { cn } from "cn";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRef, useState, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";
import { Skeleton } from "skullet/react";

export function PlayButton({
  track,
  color,
  className = "btn",
  ...props
}: ComponentProps<"button"> & { track: PlaybackTrack; color?: string }) {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);
  const isThisTrackPlaying = Boolean(track.url) && nowPlaying?.url === track.url;

  return (
    <button
      type="button"
      aria-label={isThisTrackPlaying ? "Stop playback" : "Play track"}
      aria-pressed={isThisTrackPlaying}
      {...props}
      className={cn(className, "size-9 shrink-0 justify-center")}
      style={{ backgroundColor: color }}
      disabled={!track.url}
      onClick={() => setNowPlaying(isThisTrackPlaying ? undefined : track)}
    >
      {isThisTrackPlaying ? "■" : "▶"}
    </button>
  );
}

// a play button that names its track in a popover
export function NamedPlayButton({
  track,
  note,
  ...props
}: ComponentProps<typeof PlayButton> & { note?: string }) {
  const popoverProps = usePopover(<TrackCard track={track} note={note} />);

  return <PlayButton {...props} {...popoverProps} track={track} />;
}

export function TrackCard({ track, note }: { track: PlaybackTrack; note?: string }) {
  return (
    <div className="flex flex-col">
      {note && <span className="text-sm opacity-60">{note}</span>}
      <span className="font-bold">{track.title}</span>
      {track.artist && <span>{track.artist}</span>}
    </div>
  );
}

const sampleTrack: PlaybackTrack = { title: "A track title", artist: "An artist" };

// with play on hover on, hovering plays the track from `load`; `popover` shows while hovered,
// or, when it's a function of the track, only while that track loads and plays
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
    (playing || loading) && card != null ? (
      <PlayingPrefix loading={loading}>{card}</PlayingPrefix>
    ) : (
      card
    ),
  );

  // the hover in progress, so a track that loads after the pointer left never starts
  const hover = useRef<{ url?: string }>(undefined);

  return {
    ...popoverProps,
    onMouseEnter(event) {
      popoverProps.onMouseEnter(event);
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
    onMouseLeave() {
      popoverProps.onMouseLeave();
      const url = hover.current?.url;
      hover.current = undefined;
      setPlaying(undefined);
      setLoading(false);

      if (url) setNowPlaying((playing) => (playing?.url === url ? undefined : playing));
    },
  };
}

function PlayingPrefix({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <Skeleton loading={loading} label="Loading track">
      <div className="flex items-start gap-2">
        <span className="flex h-lh shrink-0 items-center" aria-label="playing">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </span>
        {children}
      </div>
    </Skeleton>
  );
}
