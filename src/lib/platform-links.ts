import { trimItunesCollectionPostfix } from "./api/platforms/itunes-data.ts";

export const platforms = {
  lastfm: { name: "last.fm", domain: "last.fm", icon: "/last-fm.ico" },
  spotify: { name: "spotify", domain: "spotify.com", icon: "/spotify-com.png" },
  apple: {
    name: "apple music",
    domain: "music.apple.com",
    icon: "/music-apple-com.png",
  },
  aoty: { name: "AOTY", domain: "albumoftheyear.org" },
  rym: { name: "RYM", domain: "rateyourmusic.com" },
  bandcamp: {
    name: "bandcamp",
    domain: "bandcamp.com",
    icon: "/bandcamp-com.png",
  },
  soundcloak: { name: "soundcloak", domain: "sc.maid.zone" },
} as const;

type PlatformId = keyof typeof platforms;

export interface PlatformLink {
  name: string;
  icon?: string;
  href: string;
}

function toLinks(hrefs: Partial<Record<PlatformId, string>>): PlatformLink[] {
  return Object.entries(hrefs).map(([id, href]) => ({ ...platforms[id as PlatformId], href }));
}

export function artistLinks(artistName: string, appleArtistId: number) {
  const name = encodeURIComponent(artistName);

  return toLinks({
    lastfm: `https://last.fm/music/${name}`,
    spotify: `https://open.spotify.com/search/${name}`,
    apple: `https://music.apple.com/artist/${appleArtistId}`,
    aoty: `https://www.albumoftheyear.org/search/artists/?q=${name}`,
    rym: `https://rateyourmusic.com/search?searchtype=a&searchterm=${name}`,
    bandcamp: `https://bandcamp.com/search?q=${name}&item_type=b`,
    soundcloak: `https://sc.maid.zone/search?q=${name}&type=users`,
  });
}

export function albumLinks(album: {
  artistName: string;
  collectionName: string;
  collectionViewUrl: string;
}) {
  const artist = encodeURIComponent(album.artistName);
  const title = trimItunesCollectionPostfix(album.collectionName);
  const query = encodeURIComponent(`${album.artistName} ${title}`);

  return toLinks({
    lastfm: `https://last.fm/music/${artist}/${encodeURIComponent(title)}`,
    spotify: `https://open.spotify.com/search/${query}`,
    apple: album.collectionViewUrl,
    aoty: `https://www.albumoftheyear.org/search/albums/?q=${query}`,
    rym: `https://rateyourmusic.com/search?searchtype=l&searchterm=${query}`,
    bandcamp: `https://bandcamp.com/search?q=${query}&item_type=a`,
    soundcloak: `https://sc.maid.zone/search?q=${query}&type=playlists`,
  });
}

export function trackLinks(track: { artistName: string; trackName: string; trackViewUrl: string }) {
  const artist = encodeURIComponent(track.artistName);
  const query = encodeURIComponent(`${track.artistName} ${track.trackName}`);

  return toLinks({
    lastfm: `https://last.fm/music/${artist}/_/${encodeURIComponent(track.trackName)}`,
    spotify: `https://open.spotify.com/search/${query}`,
    apple: track.trackViewUrl,
    bandcamp: `https://bandcamp.com/search?q=${query}&item_type=t`,
    soundcloak: `https://sc.maid.zone/search?q=${query}&type=tracks`,
  });
}
