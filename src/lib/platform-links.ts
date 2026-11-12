import { trimItunesCollectionPostfix } from "./api/platforms/itunes-data.ts";

export interface PlatformLink {
  name: string;
  icon?: string;
  href: string;
}

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

export function artistLinks(artistName: string, appleArtistId?: number): PlatformLink[] {
  const encodedArtistName = encodeURIComponent(artistName);
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodedArtistName}`,
    },
    {
      ...platforms.spotify,
      href: `https://open.spotify.com/search/${encodedArtistName}`,
    },
    {
      ...platforms.apple,
      href: appleArtistId
        ? `https://music.apple.com/artist/${appleArtistId}`
        : `https://music.apple.com/search?term=${encodedArtistName}`,
    },
    {
      ...platforms.aoty,
      href: `https://www.albumoftheyear.org/search/artists/?q=${encodedArtistName}`,
    },
    {
      ...platforms.rym,
      href: `https://rateyourmusic.com/search?searchtype=a&searchterm=${encodedArtistName}`,
    },
    {
      ...platforms.bandcamp,
      href: `https://bandcamp.com/search?q=${encodedArtistName}&item_type=b`,
    },
    {
      ...platforms.soundcloak,
      href: `https://sc.maid.zone/search?q=${encodedArtistName}&type=users`,
    },
  ];
}

export function albumLinks(album: {
  artistName: string;
  collectionName: string;
  collectionViewUrl: string;
}): PlatformLink[] {
  const streamlinedCollectionName = trimItunesCollectionPostfix(album.collectionName);
  const constructedSearchQuery = encodeURIComponent(
    `${album.artistName} ${streamlinedCollectionName}`,
  );
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodeURIComponent(album.artistName)}/${encodeURIComponent(streamlinedCollectionName)}`,
    },
    {
      ...platforms.spotify,
      href: `https://open.spotify.com/search/${constructedSearchQuery}`,
    },
    {
      ...platforms.apple,
      href:
        album.collectionViewUrl || `https://music.apple.com/search?term=${constructedSearchQuery}`,
    },
    {
      ...platforms.aoty,
      href: `https://www.albumoftheyear.org/search/albums/?q=${constructedSearchQuery}`,
    },
    {
      ...platforms.rym,
      href: `https://rateyourmusic.com/search?searchtype=l&searchterm=${constructedSearchQuery}`,
    },
    {
      ...platforms.bandcamp,
      href: `https://bandcamp.com/search?q=${constructedSearchQuery}&item_type=a`,
    },
    {
      ...platforms.soundcloak,
      href: `https://sc.maid.zone/search?q=${constructedSearchQuery}&type=playlists`,
    },
  ];
}

export function trackLinks(track: {
  artistName: string;
  trackName: string;
  trackViewUrl: string;
}): PlatformLink[] {
  const constructedSearchQuery = encodeURIComponent(`${track.artistName} ${track.trackName}`);
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodeURIComponent(track.artistName)}/_/${encodeURIComponent(track.trackName)}`,
    },
    {
      ...platforms.spotify,
      href: `https://open.spotify.com/search/${constructedSearchQuery}`,
    },
    {
      ...platforms.apple,
      href: track.trackViewUrl || `https://music.apple.com/search?term=${constructedSearchQuery}`,
    },
    {
      ...platforms.bandcamp,
      href: `https://bandcamp.com/search?q=${constructedSearchQuery}&item_type=t`,
    },
    {
      ...platforms.soundcloak,
      href: `https://sc.maid.zone/search?q=${constructedSearchQuery}&type=tracks`,
    },
  ];
}
