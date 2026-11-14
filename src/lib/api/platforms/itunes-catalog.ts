import { cached } from "../../cache.server.ts";
import type { StoreCountry } from "../../store-country.ts";
import type * as itunes from "itunes-store-api";
import { up } from "up-fetch";

const catalogLimit = 200;

const itunesFetch = up(fetch, () => ({
  baseUrl: "https://itunes.apple.com",
  timeout: 8000,
  // apple answers bursts with an empty 403 instead of a 429
  parseRejected: (response) =>
    new Error(
      response.status === 403 || response.status === 429
        ? "itunes is getting too many requests right now, try again in a minute"
        : `itunes responded with status ${response.status}`,
    ),
}));

function search<E extends itunes.Entities["music"]>(
  term: string,
  params: { entity: E; limit: number; country: StoreCountry },
) {
  return itunesFetch<itunes.Response<"music", E>>("/search", {
    params: { term, media: "music", explicit: "No", ...params },
  });
}

function lookup<E extends itunes.Entities["music"]>(
  id: number,
  params: { entity: E; limit: number; country: StoreCountry },
) {
  return itunesFetch<itunes.Response<"music", E>>("/lookup", {
    params: { id, media: "music", ...params },
  });
}

export const getArtistCatalog = cached(async function (artistId: number, country: StoreCountry) {
  const response = await lookup(artistId, { entity: "album", country, limit: catalogLimit });
  const results = response.results as Array<itunes.ResultMusicArtist | itunes.ResultAlbum>;

  const artist = results.find(
    (result): result is itunes.ResultMusicArtist => result.wrapperType === "artist",
  );

  if (!artist) return;

  return {
    artist,
    albums: mergeCatalogEditions(
      results.filter((result): result is itunes.ResultAlbum => result.wrapperType === "collection"),
    ),
  };
});

export function mergeCatalogEditions(albums: itunes.ResultAlbum[]) {
  const editions = new Map<string, itunes.ResultAlbum>();
  for (const album of albums) {
    const key = JSON.stringify([
      album.artistId,
      album.collectionName.toLowerCase().trim(),
      album.trackCount,
    ]);
    const existing = editions.get(key);
    const isClean = album.collectionExplicitness === "cleaned";
    const existingIsClean = existing?.collectionExplicitness === "cleaned";
    if (
      !existing ||
      (existingIsClean && !isClean) ||
      (isClean === existingIsClean && album.releaseDate < existing.releaseDate)
    ) {
      editions.set(key, album);
    }
  }
  return [...editions.values()];
}

export const lookupCatalogSongs = cached(async function (id: number, country: StoreCountry) {
  const response = await lookup(id, { entity: "song", country, limit: catalogLimit });
  return response.results as Array<
    itunes.ResultMusicArtist | itunes.ResultAlbum | itunes.ResultMusicTrack
  >;
});

export const searchCatalogArtists = cached(async (name: string, country: StoreCountry) => {
  const response = await search(name, { entity: "musicArtist", limit: 25, country });
  return response.results.filter(
    (result): result is itunes.ResultMusicArtist => result.wrapperType === "artist",
  );
});

export const searchCatalogMusic = cached(async (term: string, country: StoreCountry) => {
  const [albums, tracks] = await Promise.all([
    search(term, { entity: "album", limit: 25, country }),
    search(term, { entity: "song", limit: 25, country }),
  ]);
  return { albums: albums.results, tracks: tracks.results };
});
