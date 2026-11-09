import {
  collectSpotifyPages,
  uniqueSpotifyReleases,
  type SpotifyAlbum,
  type SpotifyArtist,
  type SpotifyPage,
  type SpotifyTrack,
} from "./spotify-data";
import { swipeSpotifyToken } from "./spotify-token.server";

export class SpotifyNotFoundError extends Error {}

export async function spotifyGet<T>(path: string): Promise<T> {
  const url = new URL(path, "https://api.spotify.com/v1/");
  if (
    url.origin !== "https://api.spotify.com" ||
    !url.pathname.startsWith("/v1/")
  )
    throw new Error("Invalid Spotify API URL");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${await swipeSpotifyToken()}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404)
    throw new SpotifyNotFoundError("Spotify item not found");
  if (!response.ok)
    throw new Error(`Spotify request failed (${response.status})`);
  return response.json();
}

export async function artistReleases(id: string, market: string) {
  const items = await collectSpotifyPages<SpotifyAlbum>(
    `artists/${id}/albums?${new URLSearchParams({ market, include_groups: "album,single,compilation", limit: "50" })}`,
    spotifyGet,
  );
  return uniqueSpotifyReleases(items);
}

export async function albumDetails(id: string, market: string) {
  const album = await spotifyGet<
    SpotifyAlbum & { tracks: SpotifyPage<Omit<SpotifyTrack, "album">> }
  >(`albums/${id}?market=${market}`);
  const { tracks: first, ...metadata } = album;
  const more = first.next
    ? await collectSpotifyPages<Omit<SpotifyTrack, "album">>(
        first.next,
        spotifyGet,
      )
    : [];
  return {
    album: metadata,
    tracks: [...first.items, ...more].map((track) => ({
      ...track,
      album: metadata,
    })),
  };
}

export async function searchCatalog(query: string, market: string) {
  return spotifyGet<{
    albums: SpotifyPage<SpotifyAlbum>;
    tracks: SpotifyPage<SpotifyTrack>;
  }>(
    `search?${new URLSearchParams({ q: query, type: "album,track", market, limit: "10" })}`,
  );
}

export async function searchArtists(query: string, market: string) {
  const result = await spotifyGet<{ artists: SpotifyPage<SpotifyArtist> }>(
    `search?${new URLSearchParams({ q: query, type: "artist", market, limit: "10" })}`,
  );
  return result.artists.items.map((artist) => ({
    ...artist,
    images: artist.images ?? [],
  }));
}
