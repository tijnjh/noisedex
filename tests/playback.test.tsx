import { MiniPlayer } from "../src/components/mini-player";
import { PlayButton } from "../src/components/play-button";
import { nowPlayingAtom } from "../src/lib/global";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hls = vi.hoisted(() => ({
  instances: [] as Array<{
    destroy: ReturnType<typeof vi.fn>;
    attachMedia: ReturnType<typeof vi.fn>;
    loadSource: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("hls.js/light", () => ({
  default: class {
    static Events = { MANIFEST_PARSED: "manifestParsed" };
    static isSupported = () => true;
    destroy = vi.fn();
    attachMedia = vi.fn();
    loadSource = vi.fn();
    on = vi.fn();
    constructor() {
      hls.instances.push(this);
    }
  },
}));

beforeEach(() => {
  hls.instances.length = 0;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue("");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("shared playback", () => {
  it("shares selection between buttons, switches sources, and releases audio when closed", async () => {
    const store = createStore();
    const view = render(
      <Provider store={store}>
        <PlayButton
          aria-label="First preview"
          track={{ title: "e.g. First", url: "https://example.com/first.mp3" }}
        />
        <PlayButton
          aria-label="Second preview"
          track={{ title: "Second", url: "https://example.com/second.mp3" }}
        />
        <MiniPlayer />
      </Provider>,
    );
    const first = view.getByRole("button", { name: "First preview" });
    const second = view.getByRole("button", { name: "Second preview" });
    expect(view.container.querySelector("audio")).toBeNull();

    fireEvent.click(first);
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    const audio = view.container.querySelector("audio")!;
    expect(audio.src).toBe("https://example.com/first.mp3");
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(second.getAttribute("aria-pressed")).toBe("false");
    expect(view.getByTitle("First").textContent).toBe("First");

    fireEvent.click(second);
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    expect(audio.src).toBe("https://example.com/second.mp3");
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(second.getAttribute("aria-pressed")).toBe("true");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);

    fireEvent.click(view.getByRole("button", { name: "Close player" }));
    await waitFor(() =>
      expect(view.container.querySelector("audio")).toBeNull(),
    );
    expect(store.get(nowPlayingAtom)).toEqual({
      title: undefined,
      url: undefined,
    });
    expect(audio.hasAttribute("src")).toBe(false);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(2);
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(2);
  });

  it("stops the selected track on a second click and ignores unavailable previews", async () => {
    const store = createStore();
    const view = render(
      <Provider store={store}>
        <PlayButton
          aria-label="Available"
          track={{ title: "Track", url: "https://example.com/track.mp3" }}
        />
        <PlayButton
          aria-label="Unavailable"
          track={{ title: "Missing", url: undefined }}
        />
        <MiniPlayer />
      </Provider>,
    );
    const unavailable = view.getByRole("button", {
      name: "Unavailable",
    }) as HTMLButtonElement;
    expect(unavailable.disabled).toBe(true);
    expect(unavailable.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(unavailable);
    expect(store.get(nowPlayingAtom).url).toBeUndefined();

    const available = view.getByRole("button", { name: "Available" });
    fireEvent.click(available);
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(available);
    await waitFor(() =>
      expect(view.container.querySelector("audio")).toBeNull(),
    );
    expect(available.getAttribute("aria-pressed")).toBe("false");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });

  it("keeps playback scoped to the app's Jotai provider", () => {
    const firstStore = createStore();
    const secondStore = createStore();
    const track = { title: "Track", url: "https://example.com/track.mp3" };
    const view = render(
      <>
        <Provider store={firstStore}>
          <PlayButton aria-label="First app" track={track} />
        </Provider>
        <Provider store={secondStore}>
          <PlayButton aria-label="Second app" track={track} />
        </Provider>
      </>,
    );
    fireEvent.click(view.getByRole("button", { name: "First app" }));
    expect(firstStore.get(nowPlayingAtom)).toEqual(track);
    expect(secondStore.get(nowPlayingAtom).url).toBeUndefined();
    expect(
      view
        .getByRole("button", { name: "Second app" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("destroys HLS on source changes and ignores stale manifest callbacks", async () => {
    const store = createStore();
    const view = render(
      <Provider store={store}>
        <PlayButton
          aria-label="Stream"
          track={{ title: "Stream", url: "https://example.com/stream.m3u8" }}
        />
        <PlayButton
          aria-label="Preview"
          track={{ title: "Preview", url: "https://example.com/preview.mp3" }}
        />
        <MiniPlayer />
      </Provider>,
    );
    fireEvent.click(view.getByRole("button", { name: "Stream" }));
    await waitFor(() => expect(hls.instances).toHaveLength(1));
    const instance = hls.instances[0];
    const audio = view.container.querySelector("audio")!;
    expect(instance.loadSource).toHaveBeenCalledWith(
      "https://example.com/stream.m3u8",
    );
    expect(instance.attachMedia).toHaveBeenCalledWith(audio);
    const onManifest = instance.on.mock.calls[0][1] as () => void;
    onManifest();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    fireEvent.click(view.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(instance.destroy).toHaveBeenCalledTimes(1));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    onManifest();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe("https://example.com/preview.mp3");
  });

  it("uses native HLS when the browser supports it", async () => {
    vi.mocked(HTMLMediaElement.prototype.canPlayType).mockReturnValue(
      "probably",
    );
    const store = createStore();
    store.set(nowPlayingAtom, {
      title: "Native stream",
      url: "https://example.com/native.m3u8",
    });
    const view = render(
      <Provider store={store}>
        <MiniPlayer />
      </Provider>,
    );
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    expect(view.container.querySelector("audio")?.src).toBe(
      "https://example.com/native.m3u8",
    );
    expect(hls.instances).toHaveLength(0);
  });
});
