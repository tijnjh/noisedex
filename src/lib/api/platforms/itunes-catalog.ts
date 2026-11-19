import {
  lookup,
  search,
  type Options,
  type ResultAlbum,
  type ResultMusicArtist,
  type ResultMusicTrack,
} from "itunes-store-api";

// plain itunes-store-api calls, so they run on the server and in the browser alike

export type StoreCountry = Options["country"];

const catalogLimit = 200;

// artists, albums and tracks share one id space, so look it up and see what it is
export async function getMusic(id: number, country: StoreCountry) {
  const { results } = await lookup("id", id, {
    entity: "song",
    country,
    limit: catalogLimit,
  });
  const result = results[0] as ResultMusicArtist | ResultAlbum | ResultMusicTrack | undefined;

  if (result?.wrapperType === "artist") {
    const { results } = await lookup("id", id, {
      entity: "album",
      country,
      limit: catalogLimit,
    });
    // the artist itself comes first
    const albums = results.filter((item) => item.wrapperType === "collection");

    return { type: "artist" as const, artist: result, albums: mergeCatalogEditions(albums) };
  }

  if (result?.wrapperType === "collection" && result.collectionType === "Album") {
    // the album itself comes first
    const tracks = results.filter((item) => item.wrapperType === "track" && item.kind === "song");

    return { type: "album" as const, album: result, tracks };
  }

  if (result?.wrapperType === "track" && result.kind === "song") {
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
  const { results } = await search(name, { entity: "musicArtist", limit: 25, country });
  return results;
}

export async function searchMusic(term: string, country: StoreCountry) {
  const [albums, tracks] = await Promise.all([
    search(term, { entity: "album", limit: 25, country }),
    search(term, { entity: "song", limit: 25, country }),
  ]);
  return { albums: albums.results, tracks: tracks.results };
}
