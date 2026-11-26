import { nowPlayingAtom } from "#lib/playback";
import { useLocation } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect } from "react";

export function NowPlayingAudio() {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);
  const pathname = useLocation({ select: (location) => location.pathname });

  // stop whatever was playing once the page changes
  useEffect(() => setNowPlaying(undefined), [pathname, setNowPlaying]);

  return (
    nowPlaying?.url && (
      <audio src={nowPlaying.url} autoPlay onEnded={() => setNowPlaying(undefined)} />
    )
  );
}
