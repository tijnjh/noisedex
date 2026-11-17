import { usePopover } from "#hooks/use-popover";
import {
  itunesPlayback,
  nowPlayingAtom,
  previewPlayback,
  stoppedPlayback,
  type PlaybackTrack,
} from "#lib/playback";
import { cn } from "cn";
import { useAtom } from "jotai";
import { Skeleton } from "skullet/react";
import type { ComponentProps, ReactNode } from "react";

export function PlayButton({
  track,
  ...props
}: ComponentProps<"button"> & { track: PlaybackTrack }) {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);
  const isThisTrackPlaying = Boolean(track.url) && nowPlaying.url === track.url;

  return (
    <button
      type="button"
      aria-label={isThisTrackPlaying ? "Stop playback" : "Play track"}
      aria-pressed={isThisTrackPlaying}
      {...props}
      disabled={!track.url}
      onClick={() => setNowPlaying(isThisTrackPlaying ? stoppedPlayback : track)}
    >
      {isThisTrackPlaying ? "■" : "▶"}
    </button>
  );
}

export function TrackPlayButton({ track }: { track: Parameters<typeof itunesPlayback>[0] }) {
  return (
    <NamedPlayButton
      track={itunesPlayback(track)}
      note={track.previewUrl ? "30 second preview" : undefined}
      className="btn-inverse"
    />
  );
}

export function PreviewPlayButton({
  preview,
  color,
}: {
  preview: { title: string; url: string };
  color?: string;
}) {
  return (
    <PlayButton
      className="btn border-0 size-9 shrink-0 justify-center"
      style={{ backgroundColor: color }}
      track={previewPlayback(preview)}
    />
  );
}

export function PlayingPrefix({
  loading = false,
  children,
}: {
  loading?: boolean;
  children?: ReactNode;
}) {
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

export function TrackCard({ track, note }: { track: PlaybackTrack; note?: string }) {
  return (
    <div className="flex flex-col">
      {note && <span className="text-sm opacity-60">{note}</span>}
      <span className="font-bold">{track.title}</span>
      {track.artist && <span>{track.artist}</span>}
    </div>
  );
}

export function NamedPlayButton({
  track,
  note,
  color,
  className = "btn",
}: {
  track: PlaybackTrack;
  note?: string;
  color?: string;
  className?: string;
}) {
  const triggerProps = usePopover(<TrackCard track={track} note={note} />);

  return (
    <PlayButton
      className={cn(className, "size-9 shrink-0 justify-center")}
      style={{ backgroundColor: color }}
      track={track}
      {...triggerProps}
    />
  );
}
