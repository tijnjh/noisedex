export interface PlatformLink {
  name: string;
  icon?: string;
  href: string;
}

export type Linkable =
  | {
      kind: "artist";
      name: string;
      spotifyId: string;
      itunesArtistId?: number;
    }
  | {
      kind: "album";
      artistName: string;
      title: string;
      appleMusicUrl: string;
    }
  | {
      kind: "track";
      artistName: string;
      title: string;
      appleMusicUrl: string;
    };

const e = encodeURIComponent;

/** "where else to find this", for any artist, album or track */
export function platformLinksFor(entity: Linkable): PlatformLink[] {
  switch (entity.kind) {
    case "artist": {
      const name = e(entity.name);
      return compact([
        lastFm(`/music/${name}`),
        spotify(`/artist/${e(entity.spotifyId)}`),
        entity.itunesArtistId !== undefined &&
          appleMusic(`https://music.apple.com/artist/${entity.itunesArtistId}`),
        aoty(`/search/artists/?q=${name}`),
        rym(`/artist/${name}-1`),
        bandcamp(name, "b"),
        soundcloak(name, "users"),
      ]);
    }

    case "album": {
      const query = e(`${entity.artistName} ${entity.title}`);
      const artist = e(entity.artistName);
      const title = e(entity.title);
      return [
        lastFm(`/music/${artist}/${title}`),
        spotify(`/search/${query}`),
        appleMusic(entity.appleMusicUrl),
        aoty(`/search/albums/?q=${query}`),
        rym(`/release/album/${artist}/${title}/`),
        bandcamp(query, "a"),
        soundcloak(query, "playlists"),
      ];
    }

    case "track": {
      const query = e(`${entity.artistName} ${entity.title}`);
      return [
        lastFm(`/music/${e(entity.artistName)}/_/${e(entity.title)}`),
        spotify(`/search/${query}`),
        appleMusic(entity.appleMusicUrl),
        bandcamp(query, "t"),
        soundcloak(query, "tracks"),
      ];
    }
  }
}

function compact(links: Array<PlatformLink | false>) {
  return links.filter((link): link is PlatformLink => Boolean(link));
}

const lastFm = (path: string): PlatformLink => ({
  name: "last.fm",
  icon: "/last-fm.ico",
  href: `https://last.fm${path}`,
});

const spotify = (path: string): PlatformLink => ({
  name: "spotify",
  icon: "/spotify-com.png",
  href: `https://open.spotify.com${path}`,
});

const appleMusic = (href: string): PlatformLink => ({
  name: "apple music",
  icon: "/music-apple-com.png",
  href,
});

const aoty = (path: string): PlatformLink => ({
  name: "AOTY",
  href: `https://www.albumoftheyear.org${path}`,
});

const rym = (path: string): PlatformLink => ({
  name: "RYM",
  href: `https://rateyourmusic.com${path}`,
});

const bandcamp = (query: string, itemType: "a" | "b" | "t"): PlatformLink => ({
  name: "bandcamp",
  icon: "/bandcamp-com.png",
  href: `https://bandcamp.com/search?q=${query}&item_type=${itemType}`,
});

const soundcloak = (
  query: string,
  type: "users" | "playlists" | "tracks",
): PlatformLink => ({
  name: "soundcloak",
  href: `https://sc.maid.zone/search?q=${query}&type=${type}`,
});
