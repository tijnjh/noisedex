import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

let clientId: string | undefined;
interface Track {
  id: number;
  title: string;
  policy?: string;
  streamable?: boolean;
  track_authorization: string;
  user: { username: string };
  media?: {
    transcodings: {
      snipped: boolean;
      url: string;
      format: { protocol: string };
    }[];
  };
}
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
async function api<T>(path: string): Promise<T> {
  if (!clientId) {
    const html = await (
      await fetch("https://soundcloud.com", {
        signal: AbortSignal.timeout(8000),
      })
    ).text();
    clientId = html.match(/"hydratable":"apiClient","data":\{"id":"([^"]+)"/)?.[1];
    if (!clientId) throw new Error("SoundCloud client ID unavailable");
  }
  const url = new URL(path.startsWith("https:") ? path : `https://api-v2.soundcloud.com${path}`);
  url.searchParams.set("client_id", clientId);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`SoundCloud: ${response.status}`);
  return response.json();
}

export const matchAlbum = createServerFn()
  .validator(v.object({ artist: v.string(), album: v.string() }))
  .handler(async ({ data }) => {
    try {
      const result = await api<{
        collection: { id: number; title: string; user: Track["user"] }[];
      }>(`/search/playlists?q=${encodeURIComponent(`${data.artist} ${data.album}`)}&limit=10`);
      const album = result.collection.find(
        (p) =>
          normalize(p.title) === normalize(data.album) &&
          normalize(p.user.username) === normalize(data.artist),
      );
      if (!album) return [];
      const playlist = await api<{ tracks: Track[] }>(`/playlists/${album.id}`);
      const tracks = await api<Track[]>(
        `/tracks?ids=${playlist.tracks.map((t) => t.id).join(",")}`,
      );
      return (
        await Promise.all(
          tracks.map(async (t) => {
            if (!["ALLOW", "MONETIZE"].includes(t.policy ?? "") || !t.streamable) return null;
            const stream = t.media?.transcodings.find(
              (s) => !s.snipped && ["progressive", "hls"].includes(s.format.protocol),
            );
            if (!stream) return null;
            const url = new URL(stream.url);
            url.searchParams.set("track_authorization", t.track_authorization);
            try {
              const result = await api<{ url: string }>(url.href);
              return { title: t.title, url: result.url };
            } catch {
              return null;
            }
          }),
        )
      ).filter((t) => t !== null);
    } catch {
      return [];
    }
  });

export function trackUrl(tracks: { title: string; url: string }[], title: string, artist: string) {
  return tracks.find(
    (t) =>
      normalize(t.title) === normalize(title) ||
      normalize(t.title) === normalize(`${artist} ${title}`),
  )?.url;
}
