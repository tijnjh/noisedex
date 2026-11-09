import { Artist, Genre, GenreMeta } from "./everynoise-types";
import { up } from "up-fetch";

export type * from "./everynoise-types";

export const everynoiseFetch = up(fetch, () => ({
  baseUrl: "https://cdn.jsdelivr.net/gh/tijnjh/everynoise-json/data",
}));

export async function getAllGenres() {
  return await everynoiseFetch<Genre[]>("/genres.json");
}

export async function getGenreBySlug(genreSlug: string) {
  return await everynoiseFetch<GenreMeta>(`/genres/${genreSlug}.json`);
}

export async function getArtistById(artistId: string) {
  return await everynoiseFetch<Artist & { genres: string[] }>(
    `/artists/${artistId}.json`,
  );
}
