import { cached } from "../../cache.server";
import { DAY } from "../../time";
import type { ArtistMeta, Genre, GenreMeta } from "./everynoise-types";
import { lookupArtists } from "./spotify";
import { isResponseError, up } from "up-fetch";

// pinned so jsdelivr caches it
const everynoiseDataCommit = "1b1adbca29e767a44fd80dd20cfdcb1a40b39aaa";

const everynoiseFetch = up(fetch, () => ({
  timeout: 4000,
  baseUrl: `https://cdn.jsdelivr.net/gh/tijnjh/everynoise-json@${everynoiseDataCommit}/data-min`,
}));

// the data is pinned to a commit, so it only changes when we deploy
const lifetime = { freshMs: DAY, staleMs: 7 * DAY };

async function fetchIfExists<T>(path: string) {
  try {
    return await everynoiseFetch<T>(path);
  } catch (error) {
    if (isResponseError(error) && error.status === 404) return;
    throw error;
  }
}

export const getAllGenres = cached(() => everynoiseFetch<Genre[]>("/genres.json"), lifetime);

export const getGenreBySlug = cached(
  (genreSlug: string) => fetchIfExists<GenreMeta>(`/genres/${genreSlug}.json`),
  lifetime,
);

const getArtistById = cached(
  (artistId: string) => fetchIfExists<ArtistMeta>(`/artists/${artistId}.json`),
  lifetime,
);

// everynoise artists are keyed by spotify id, so the name goes through spotify first
export const getArtistByName = cached(async (artistName: string) => {
  const name = artistName.trim().toLowerCase();

  const artists = await lookupArtists({ data: name });
  const artist = artists.find((candidate) => candidate.name.trim().toLowerCase() === name);

  return artist && getArtistById(artist.id);
}, lifetime);
