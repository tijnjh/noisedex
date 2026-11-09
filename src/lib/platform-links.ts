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
  aoty: { name: "AOTY" },
  rym: { name: "RYM", domain: "rateyourmusic.com" },
  bandcamp: {
    name: "bandcamp",
    domain: "bandcamp.com",
    icon: "/bandcamp-com.png",
  },
  soundcloak: { name: "soundcloak", domain: "sc.maid.zone" },
} as const;

export function artistLinks(
  artistName: string,
  spotifyId: string,
): PlatformLink[] {
  const encodedArtistName = encodeURIComponent(artistName);
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodedArtistName}`,
    },
    {
      ...platforms.spotify,
      href: `https://open.spotify.com/artist/${spotifyId}`,
    },
    {
      ...platforms.apple,
      href: `https://music.apple.com/search?term=${encodedArtistName}`,
    },
    {
      ...platforms.aoty,
      href: `https://www.albumoftheyear.org/search/artists/?q=${encodedArtistName}`,
    },
    {
      ...platforms.rym,
      href: `https://rateyourmusic.com/artist/${encodedArtistName}-1`,
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
  name: string;
  spotifyUrl: string;
}): PlatformLink[] {
  const albumName = album.name;
  const constructedSearchQuery = encodeURIComponent(
    `${album.artistName} ${albumName}`,
  );
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodeURIComponent(album.artistName)}/${encodeURIComponent(albumName)}`,
    },
    {
      ...platforms.spotify,
      href: album.spotifyUrl,
    },
    {
      ...platforms.apple,
      href: `https://music.apple.com/search?term=${constructedSearchQuery}`,
    },
    {
      ...platforms.aoty,
      href: `https://www.albumoftheyear.org/search/albums/?q=${constructedSearchQuery}`,
    },
    {
      ...platforms.rym,
      href: `https://rateyourmusic.com/release/album/${encodeURIComponent(album.artistName)}/${encodeURIComponent(albumName)}/`,
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
  spotifyUrl: string;
}): PlatformLink[] {
  const constructedSearchQuery = encodeURIComponent(
    `${track.artistName} ${track.trackName}`,
  );
  return [
    {
      ...platforms.lastfm,
      href: `https://last.fm/music/${encodeURIComponent(track.artistName)}/_/${encodeURIComponent(track.trackName)}`,
    },
    {
      ...platforms.spotify,
      href: track.spotifyUrl,
    },
    {
      ...platforms.apple,
      href: `https://music.apple.com/search?term=${constructedSearchQuery}`,
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
