import type { StoreCountry } from "../../store-country.ts";
import {
  lookup,
  search,
  type ResultAlbum,
  type ResultMusicArtist,
  type ResultMusicTrack,
} from "itunes-store-api";

// plain itunes-store-api calls, so they run on the server and in the browser alike

const catalogLimit = 200;

// artists, albums and tracks share one id space, so look it up and see what it is
export async function getMusic(id: number, country: StoreCountry) {
  const { results } = await lookup("id", id, {
    media: "music",
    entity: "song",
    country,
    limit: catalogLimit,
  });
  const result = results[0] as ResultMusicArtist | ResultAlbum | ResultMusicTrack | undefined;

  if (result?.wrapperType === "artist" && result.artistId === id) {
    const { results } = await lookup("id", id, {
      media: "music",
      entity: "album",
      country,
      limit: catalogLimit,
    });

    return {
      type: "artist" as const,
      artist: result,
      albums: mergeCatalogEditions(
        (results as Array<ResultMusicArtist | ResultAlbum>).filter(
          (item): item is ResultAlbum => item.wrapperType === "collection",
        ),
      ),
    };
  }

  if (
    result?.wrapperType === "collection" &&
    result.collectionType === "Album" &&
    result.collectionId === id
  ) {
    const tracks = (results as Array<ResultAlbum | ResultMusicTrack>).filter(
      (item): item is ResultMusicTrack => item.wrapperType === "track" && item.kind === "song",
    );

    return { type: "album" as const, album: result, tracks };
  }

  if (result?.wrapperType === "track" && result.kind === "song" && result.trackId === id) {
    return { type: "track" as const, track: result };
  }
}

// keeps one edition per release: explicit over clean, then the earliest
function mergeCatalogEditions(albums: ResultAlbum[]) {
  const editions = new Map<string, ResultAlbum>();
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

export async function searchArtists(name: string, country: StoreCountry) {
  const { results } = await search(name, {
    media: "music",
    entity: "musicArtist",
    limit: 25,
    country,
  });
  return results.filter((result): result is ResultMusicArtist => result.wrapperType === "artist");
}

export async function searchMusic(term: string, country: StoreCountry) {
  const [albums, tracks] = await Promise.all([
    search(term, { media: "music", entity: "album", limit: 25, country }),
    search(term, { media: "music", entity: "song", limit: 25, country }),
  ]);
  return { albums: albums.results, tracks: tracks.results };
}
