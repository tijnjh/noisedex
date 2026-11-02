import { siteName, siteUrl } from "./constants";
import type { Release, Track } from "./releases";

export interface PageHead {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string }>;
  scripts?: Array<{ type: string; children: string }>;
}

/** title, description and canonical link for any page */
export function pageHead(page: {
  title: string;
  description?: string;
  path: string;
  og?: { type: string; image?: string };
  jsonLd?: object;
}): PageHead {
  const title = `${page.title} | ${siteName}`;
  const url = `${siteUrl}${page.path}`;

  const meta: PageHead["meta"] = [{ title }];
  if (page.description)
    meta.push({ name: "description", content: page.description });

  if (page.og) {
    meta.push(
      { property: "og:type", content: page.og.type },
      { property: "og:title", content: title },
      { property: "og:url", content: url },
    );
    if (page.description)
      meta.push({ property: "og:description", content: page.description });
    if (page.og.image)
      meta.push({ property: "og:image", content: page.og.image });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
    scripts: page.jsonLd && [
      {
        type: "application/ld+json",
        children: jsonLd({
          "@context": "https://schema.org",
          "@id": url,
          url,
          ...page.jsonLd,
        }),
      },
    ],
  };
}

/** JSON-LD that is safe to inline in a <script> tag */
export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function isoDuration(ms: number | undefined) {
  if (ms === undefined) return;
  return `PT${Math.round(ms / 1000)}S`;
}

export function albumHead(album: Release, tracks: Track[]) {
  return pageHead({
    title: `${album.name} by ${album.artistName}`,
    description: `Explore ${album.name} by ${album.artistName}: release date, genre, and ${tracks.length} tracks with previews on ${siteName}.`,
    path: `/album/${album.id}`,
    og: { type: "music.album", image: album.artworkUrl },
    jsonLd: {
      "@type": "MusicAlbum",
      name: album.name,
      byArtist: { "@type": "MusicGroup", name: album.artistName },
      datePublished: album.releaseDate,
      genre: album.genre,
      image: album.artworkUrl,
      numTracks: tracks.length,
      track: tracks.map((track) => ({
        "@type": "MusicRecording",
        name: track.title,
        position: track.trackNumber,
        duration: isoDuration(track.durationMs),
      })),
    },
  });
}

export function trackHead(track: Track) {
  return pageHead({
    title: `${track.title} by ${track.artistName}`,
    description: `Explore ${track.title} by ${track.artistName} from ${track.albumName}: release date, genre, and listening links on ${siteName}.`,
    path: `/track/${track.id}`,
    og: { type: "music.song", image: track.artworkUrl },
    jsonLd: {
      "@type": "MusicRecording",
      name: track.title,
      byArtist: { "@type": "MusicGroup", name: track.artistName },
      inAlbum: {
        "@type": "MusicAlbum",
        name: track.albumName,
        url: `${siteUrl}/album/${track.albumId}`,
      },
      datePublished: track.releaseDate,
      genre: track.genre,
      image: track.artworkUrl,
      duration: isoDuration(track.durationMs),
    },
  });
}
