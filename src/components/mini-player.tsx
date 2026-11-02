import { nowPlaying, setNowPlaying } from "../lib/global";
import { cn } from "cn";
import type Hls from "hls.js";
import { createEffect, onCleanup, Show } from "solid-js";

export function MiniPlayer() {
  let audioRef!: HTMLAudioElement;

  createEffect(nowPlaying, (track) => {
    if (!track.url || !audioRef) return;
    const audio = audioRef;
    const url = track.url;
    let hls: Hls | undefined;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
      hls?.destroy();
    });

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
  });
  const cleanTitle = () => nowPlaying().title?.replace("e.g.", "").trim();

  return (
    <div
      class={cn(
        "fixed right-[calc(0.75rem+env(safe-area-inset-right,0px))] bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-[calc(0.75rem+env(safe-area-inset-left,0px))] z-999 flex-col gap-3 border bg-zinc-50-950 p-3 md:w-100!",
        nowPlaying().url ? "flex" : "hidden",
      )}
    >
      <div class="flex items-center justify-between">
        <span title={cleanTitle()} class="truncate">
          {cleanTitle()}
        </span>

        <button
          class="btn-inverse size-9 justify-center"
          onClick={() => setNowPlaying({ title: undefined, url: undefined })}
        >
          &times;
        </button>
      </div>

      <Show when={nowPlaying().url}>
        <audio ref={audioRef} controls></audio>
      </Show>
    </div>
  );
}
