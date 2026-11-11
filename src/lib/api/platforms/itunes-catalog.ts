import { cached } from "../../cache.server.ts";
import type { StoreCountry } from "../../store-country.ts";
import * as itunes from "itunes-store-api";

const catalogLimit = 200;

export const getArtistCatalog = cached(async function (
  artistId: number,
  country: StoreCountry,
) {
  const response = await itunes.lookup("id", artistId, {
    media: "music",
    entity: "album",
    country,
    limit: catalogLimit,
  });
  const results = response.results as Array<
    itunes.ResultMusicArtist | itunes.ResultAlbum
  >;

  const artist = results.find(
    (result): result is itunes.ResultMusicArtist =>
      result.wrapperType === "artist",
  );

  if (!artist) return;

  return {
    artist,
    albums: mergeCatalogEditions(
      results.filter(
        (result): result is itunes.ResultAlbum =>
          result.wrapperType === "collection",
      ),
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

export const lookupCatalogSongs = cached(async function (
  id: number,
  country: StoreCountry,
) {
  const response = await itunes.lookup("id", id, {
    media: "music",
    entity: "song",
    country,
    limit: catalogLimit,
  });
  return response.results as Array<
    itunes.ResultAlbum | itunes.ResultMusicTrack
  >;
});

export const searchCatalogArtists = cached(
  async (name: string, country: StoreCountry) => {
    const response = await itunes.search(name, {
      media: "music",
      entity: "musicArtist",
      limit: 25,
      country,
    });
    return response.results.filter(
      (result): result is itunes.ResultMusicArtist =>
        result.wrapperType === "artist",
    );
  },
);
