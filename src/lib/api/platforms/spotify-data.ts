export interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string }[];
}
export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: "album" | "single" | "compilation";
  artists: SpotifyArtist[];
  images: { url: string }[];
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  total_tracks: number;
  external_urls: { spotify: string };
}
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  duration_ms: number;
  track_number: number;
  disc_number: number;
  explicit: boolean;
  album: SpotifyAlbum;
  external_urls: { spotify: string };
}
export interface SpotifyPage<T> {
  items: T[];
  next: string | null;
}

export function spotifyReleaseType(album: SpotifyAlbum) {
  if (/\bEP$/i.test(album.name)) return "EP";
  if (album.album_type === "album") return "LP";
  if (album.album_type === "compilation") return "Compilation";
  return album.total_tracks === 1 ? "Single" : "Single / EP";
}

export function formatReleaseDate(date: string) {
  if (/^\d{4}$/.test(date)) return date;
  if (/^\d{4}-\d{2}$/.test(date)) {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}-01`));
  }
  const parsed = new Date(date);
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(parsed)
    : "Unknown date";
}

export async function collectSpotifyPages<T>(
  first: string,
  get: (path: string) => Promise<SpotifyPage<T>>,
) {
  const items: T[] = [];
  const visited = new Set<string>();
  let next: string | null = first;
  while (next) {
    if (visited.has(next)) throw new Error("Repeated Spotify pagination URL");
    visited.add(next);
    const page: SpotifyPage<T> = await get(next);
    items.push(...page.items);
    next = page.next;
  }
  return items;
}

export function uniqueSpotifyReleases(albums: SpotifyAlbum[]) {
  return [...new Map(albums.map((album) => [album.id, album])).values()];
}
