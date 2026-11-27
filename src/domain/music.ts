import type * as catalog from "#lib/api/platforms/itunes-catalog";

export type Music = NonNullable<Awaited<ReturnType<typeof catalog.getMusic>>>;
export type MusicSearch = Awaited<ReturnType<typeof catalog.searchMusic>>;
export type ArtistResult = Awaited<ReturnType<typeof catalog.searchArtists>>[number];

export interface ArtworkColors {
  accent?: string | undefined;
  middle?: string | undefined;
  background?: string | undefined;
}

export interface FantanoReview {
  excerpt: string | null;
  url: string;
}

export type WikipediaSubject =
  | { kind: "artist"; name: string }
  | { kind: "genre"; name: string }
  | { kind: "album"; name: string; artist: string };
