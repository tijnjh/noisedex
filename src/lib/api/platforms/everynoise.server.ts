import { cached } from "../../cache.server";
import { ArtistMeta, Genre, GenreMeta } from "./everynoise-types";
import { lookupArtists } from "./spotify";
import { isResponseError, up } from "up-fetch";

export const everynoiseFetch = up(fetch, () => ({
  timeout: 4000,
  baseUrl: "https://cdn.jsdelivr.net/gh/tijnjh/everynoise-json/data-min",
}));

export const getAllGenres = cached(
  async () => {
    return await everynoiseFetch<Genre[]>("/genres.json");
  },
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
);

export const getGenreBySlug = cached(
  async (genreSlug: string) => {
    try {
      return await everynoiseFetch<GenreMeta>(`/genres/${genreSlug}.json`);
    } catch (error) {
      if (isResponseError(error) && error.status === 404) return;
      throw error;
    }
  },
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
);

export const getArtistById = cached(
  async (artistId: string) => {
    return await everynoiseFetch<ArtistMeta>(`/artists/${artistId}.json`);
  },
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
);

export const getArtistByName = cached(
  async (artistName: string) => {
    artistName = artistName.trim();

    if (!artistName) return;

    const artists = await lookupArtists({ data: artistName });

    const artist = artists.find((a) => a.name.trim().toLowerCase() === artistName.toLowerCase());

    if (!artist) return;

    try {
      return await getArtistById(artist.id);
    } catch (error) {
      if (isResponseError(error) && error.status === 404) return;
      throw error;
    }
  },
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
);
