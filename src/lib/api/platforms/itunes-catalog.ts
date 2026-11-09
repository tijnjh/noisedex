import type { StoreCountry } from "../../store-country.ts";
import * as itunes from "itunes-store-api";

const catalogLimit = 200;

export async function getArtistCatalog(
  artistId: number,
  country: StoreCountry,
) {
  const response = await itunes.lookup("id", artistId, {
    media: "music",
    entity: "album",
    country,
    limit: catalogLimit,
  });
  return mergeCatalogEditions(
    response.results.filter(
      (result): result is itunes.ResultAlbum =>
        result.wrapperType === "collection",
    ),
  );
}

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

export async function lookupCatalogSongs(id: number, country: StoreCountry) {
  const response = await itunes.lookup("id", id, {
    media: "music",
    entity: "song",
    country,
    limit: catalogLimit,
  });
  return response.results as Array<
    itunes.ResultAlbum | itunes.ResultMusicTrack
  >;
}
