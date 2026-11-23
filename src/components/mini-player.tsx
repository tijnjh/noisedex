import { nowPlayingAtom, playOnHoverAtom } from "#lib/playback";
import { Link } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

export function MiniPlayer() {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);
  const playOnHover = useAtomValue(playOnHoverAtom);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying?.title,
      artist: nowPlaying?.artist,
      album: "noisedex.com",
      artwork: nowPlaying?.artworkSrc ? [{ src: nowPlaying.artworkSrc }] : undefined,
    });
  }, [nowPlaying]);

  return (
    nowPlaying?.url && (
      <div
        // hidden rather than unmounted, so the audio keeps playing
        hidden={playOnHover}
        className="z-999 mx-3 mb-3 flex min-w-0 flex-col gap-3 p-3 surface max-md:order-1 md:fixed md:bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:left-[calc(0.75rem+env(safe-area-inset-left,0px))] md:m-0 md:w-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col truncate">
            <span title={nowPlaying.title} className="truncate">
              {nowPlaying.title}
            </span>

            <Link
              to="/search"
              search={{ q: nowPlaying.artist, lucky: true }}
              title={nowPlaying.title}
              className="truncate opacity-60 hover:underline"
            >
              {nowPlaying.artist}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Close player"
            className="btn-inverse size-9 shrink-0 justify-center"
            onClick={() => setNowPlaying(undefined)}
          >
            &times;
          </button>
        </div>

        <audio
          src={nowPlaying.url}
          autoPlay
          controls
          className="w-full"
          onEnded={() => setNowPlaying(undefined)}
        />
      </div>
    )
  );
}
