import { cached, day } from "../../cache.server";
import { genreNameToSlug, type ArtistMeta, type Genre, type GenreMeta } from "./everynoise-data";
import { searchArtists } from "./spotify.server";
import uFuzzy from "@leeoniya/ufuzzy";
import { isResponseError, up } from "up-fetch";

// pinned so jsdelivr caches it, and so the data only changes when we deploy
const everynoiseDataCommit = "1b1adbca29e767a44fd80dd20cfdcb1a40b39aaa";

const everynoiseFetch = up(fetch, () => ({
  timeout: 4000,
  baseUrl: `https://cdn.jsdelivr.net/gh/tijnjh/everynoise-json@${everynoiseDataCommit}/data-min`,
}));

async function fetchIfExists<T>(path: string) {
  try {
    return await everynoiseFetch<T>(path);
  } catch (error) {
    if (isResponseError(error) && error.status === 404) return;
    throw error;
  }
}

export const getAllGenres = cached(() => everynoiseFetch<Genre[]>("/genres.json"), day);

// mappings update hourly so read from main, jsdelivr refuses unpinned urls since the repo is over 50MB
const artistMappingsFetch = up(fetch, () => ({
  timeout: 20_000,
  baseUrl: "https://raw.githubusercontent.com/tijnjh/everynoise-json/main/data/artist-mappings",
}));

export const getMappedArtistIds = cached(async () => {
  const ids = await artistMappingsFetch<unknown>("/all.json");

  if (!Array.isArray(ids)) {
    throw new Error("artist-mappings/all.json is not a list");
  }

  return ids.filter((id): id is number => Number.isSafeInteger(id) && id > 0);
}, day);

export const getGenreBySlug = cached(
  (genreSlug: string) => fetchIfExists<GenreMeta>(`/genres/${genreSlug}.json`),
  day,
);

const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 1 });

// the five genres whose slug looks the most like the given one
export async function findSimilarGenres(genreSlug: string) {
  const genres = await getAllGenres();
  const slugs = genres.map((genre) => genreNameToSlug(genre.genreName));

  const [matches, info, order] = fuzzy.search(slugs, genreSlug);
  // ranking is skipped when there are too many matches, so fall back to haystack order
  const ranked = info ? order.map((i) => info.idx[i]) : (matches ?? []);

  return ranked.slice(0, 5).map((i) => genres[i]);
}

// everynoise artists are keyed by spotify id, so the name goes through spotify first
export const getArtistByName = cached(async (artistName: string) => {
  const name = artistName.trim().toLowerCase();

  const artists = await searchArtists(name);
  const artist = artists.find((candidate) => candidate.name.trim().toLowerCase() === name);

  return artist && fetchIfExists<ArtistMeta>(`/artists/${artist.id}.json`);
}, day);
