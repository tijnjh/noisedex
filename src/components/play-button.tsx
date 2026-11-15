import {
  itunesPlayback,
  nowPlayingAtom,
  previewPlayback,
  stoppedPlayback,
  type PlaybackTrack,
} from "#lib/playback";
import { useAtom } from "jotai";
import type { ComponentProps } from "react";

export function PlayButton({
  track,
  disabled,
  onClick,
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
      disabled={disabled || !track.url}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setNowPlaying(isThisTrackPlaying ? stoppedPlayback : track);
      }}
    >
      {isThisTrackPlaying ? "☐" : "▶︎"}
    </button>
  );
}

export function TrackPlayButton({
  track,
  url,
}: {
  track: Parameters<typeof itunesPlayback>[0];
  url?: string;
}) {
  return (
    <PlayButton
      className="btn-inverse size-9 shrink-0 justify-center"
      track={itunesPlayback(track, url)}
    />
  );
}

export function PreviewPlayButton({
  preview,
  color,
}: {
  preview: { title: string; url: string };
  color: string;
}) {
  return (
    <PlayButton
      title={preview.title}
      className="btn size-9 shrink-0 justify-center"
      style={{ backgroundColor: color }}
      track={previewPlayback(preview)}
    />
  );
}
