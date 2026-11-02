import { nowPlaying, setNowPlaying } from "../lib/global";
import { cn } from "cn";
import Hls from "hls.js";
import { createEffect, onCleanup, Show } from "solid-js";

export function MiniPlayer() {
  let audioRef!: HTMLAudioElement;

  createEffect(nowPlaying, (track) => {
    if (!track.url || !audioRef) return;
    let hls: Hls | undefined;
    if (
      track.url.includes(".m3u8") &&
      !audioRef.canPlayType("application/vnd.apple.mpegurl") &&
      Hls.isSupported()
    ) {
      hls = new Hls();
      hls.loadSource(track.url);
      hls.attachMedia(audioRef);
      hls.on(Hls.Events.MANIFEST_PARSED, () => audioRef.play().catch(() => {}));
    } else {
      audioRef.src = track.url;
      audioRef.play().catch(() => {});
    }
    onCleanup(() => hls?.destroy());
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
