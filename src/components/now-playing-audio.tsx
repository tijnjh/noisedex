import { nowPlayingAtom } from "#lib/playback";
import { useAtom } from "jotai";

export function NowPlayingAudio() {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);

  return (
    nowPlaying?.url && (
      <audio src={nowPlaying.url} autoPlay onEnded={() => setNowPlaying(undefined)} />
    )
  );
}
