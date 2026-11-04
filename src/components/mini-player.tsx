import { nowPlayingAtom } from "#lib/global";
import type Hls from "hls.js";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

export function MiniPlayer() {
  const [nowPlaying, setNowPlaying] = useAtom(nowPlayingAtom);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    const url = nowPlaying.url;
    if (!url || !audio) return;

    let hls: Hls | undefined;
    let cancelled = false;

    const playNative = () => {
      audio.src = url;
      audio.play().catch(() => {});
    };

    if (
      url.includes(".m3u8") &&
      !audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // @ts-expect-error The light entry point does not expose types.
      import("hls.js/light")
        .then((module) => {
          if (cancelled) return;
          const HlsLight = module.default as typeof Hls;
          if (!HlsLight.isSupported()) {
            playNative();
            return;
          }
          hls = new HlsLight();
          hls.on(HlsLight.Events.MANIFEST_PARSED, () => {
            if (!cancelled) audio.play().catch(() => {});
          });
          hls.loadSource(url);
          hls.attachMedia(audio);
        })
        .catch((error) => {
          if (!cancelled) console.error("Failed to load HLS playback", error);
        });
    } else {
      playNative();
    }

    return () => {
      cancelled = true;
      audio.pause();
      hls?.destroy();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [nowPlaying.url]);

  if (!nowPlaying.url) return null;

  const cleanTitle = nowPlaying.title?.replace("e.g.", "").trim();

  return (
    <div className="z-999 mx-3 mb-3 flex min-w-0 flex-col gap-3 border bg-zinc-50-950 p-3 max-md:order-1 md:fixed md:bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:left-[calc(0.75rem+env(safe-area-inset-left,0px))] md:m-0 md:w-100">
      <div className="flex items-center justify-between">
        <span title={cleanTitle} className="truncate">
          {cleanTitle}
        </span>

        <button
          type="button"
          aria-label="Close player"
          className="btn-inverse size-9 shrink-0 justify-center"
          onClick={() => setNowPlaying({ title: undefined, url: undefined })}
        >
          &times;
        </button>
      </div>

      <audio
        ref={audioRef}
        className="w-full"
        controls
        onEnded={() => setNowPlaying({ title: undefined, url: undefined })}
      />
    </div>
  );
}
