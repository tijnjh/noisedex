import { ArtistMeta, Genre, GenreMeta } from "./everynoise-types";
import { lookupArtists } from "./spotify";
import { isResponseError, up } from "up-fetch";

export type * from "./everynoise-types";

export const everynoiseFetch = up(fetch, () => ({
  baseUrl: "https://cdn.jsdelivr.net/gh/tijnjh/everynoise-json/data-min",
}));

export async function getAllGenres() {
  return await everynoiseFetch<Genre[]>("/genres.json");
}

export async function getGenreBySlug(genreSlug: string) {
  return await everynoiseFetch<GenreMeta>(`/genres/${genreSlug}.json`);
}

export async function getArtistById(artistId: string) {
  return await everynoiseFetch<ArtistMeta>(`/artists/${artistId}.json`);
}

export async function getArtistByName(artistName: string) {
  artistName = artistName.trim();

  if (!artistName) return;

  const artists = await lookupArtists({ data: artistName });

  const artist = artists.find(
    (a) => a.name.trim().toLowerCase() === artistName.toLowerCase(),
  );

  if (!artist) return;

  try {
    return await getArtistById(artist.id);
  } catch (error) {
    if (isResponseError(error) && error.status === 404) return;
    throw error;
  }
}
