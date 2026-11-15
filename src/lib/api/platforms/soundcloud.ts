import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

interface User {
  username: string;
}

interface Playlist {
  id: number;
  title: string;
  user: User;
}

interface Track {
  id: number;
  title: string;
  policy?: string;
  streamable?: boolean;
  track_authorization: string;
  user: User;
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

let clientId: string | undefined;

// soundcloud has no public api keys, so we borrow the one its own web app uses
async function getClientId() {
  if (clientId) return clientId;

  const response = await fetch("https://soundcloud.com", { signal: AbortSignal.timeout(8000) });
  const html = await response.text();

  clientId = html.match(/"hydratable":"apiClient","data":\{"id":"([^"]+)"/)?.[1];
  if (!clientId) throw new Error("SoundCloud client ID unavailable");

  return clientId;
}

async function api<T>(path: string): Promise<T> {
  const url = new URL(path.startsWith("https:") ? path : `https://api-v2.soundcloud.com${path}`);
  url.searchParams.set("client_id", await getClientId());

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`SoundCloud: ${response.status}`);

  return response.json();
}

async function findAlbum(artist: string, album: string) {
  const query = encodeURIComponent(`${artist} ${album}`);
  const result = await api<{ collection: Playlist[] }>(`/search/playlists?q=${query}&limit=10`);

  return result.collection.find(
    (playlist) =>
      normalize(playlist.title) === normalize(album) &&
      normalize(playlist.user.username) === normalize(artist),
  );
}

// resolves to nothing for tracks that are blocked, preview-only or otherwise unplayable
async function getStreamUrl(track: Track) {
  if (!["ALLOW", "MONETIZE"].includes(track.policy ?? "") || !track.streamable) return;

  const stream = track.media?.transcodings.find(
    (transcoding) =>
      !transcoding.snipped && ["progressive", "hls"].includes(transcoding.format.protocol),
  );
  if (!stream) return;

  const url = new URL(stream.url);
  url.searchParams.set("track_authorization", track.track_authorization);

  try {
    return (await api<{ url: string }>(url.href)).url;
  } catch {
    return;
  }
}

/** the playable tracks of the soundcloud playlist that matches an album, if there is one */
export const matchAlbum = createServerFn()
  .validator(v.object({ artist: v.string(), album: v.string() }))
  .handler(async ({ data }) => {
    try {
      const album = await findAlbum(data.artist, data.album);
      if (!album) return [];

      const playlist = await api<{ tracks: { id: number }[] }>(`/playlists/${album.id}`);
      const ids = playlist.tracks.map((track) => track.id).join(",");
      const tracks = await api<Track[]>(`/tracks?ids=${ids}`);

      const streams = await Promise.all(
        tracks.map(async (track) => {
          const url = await getStreamUrl(track);
          return url ? { title: track.title, url } : null;
        }),
      );

      return streams.filter((stream) => stream !== null);
    } catch {
      return [];
    }
  });

export function trackUrl(tracks: { title: string; url: string }[], title: string, artist: string) {
  return tracks.find(
    (track) =>
      normalize(track.title) === normalize(title) ||
      normalize(track.title) === normalize(`${artist} ${title}`),
  )?.url;
}
