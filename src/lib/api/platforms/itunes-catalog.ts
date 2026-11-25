import { trimItunesCollectionPostfix } from "./itunes-data";
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

  // feature credits get their own same-named artists, itunes ranks the real one first
  const names = new Set<string>();

  return results.filter((artist) => {
    const key = words(artist.artistName).join(" ");
    if (names.has(key)) return false;

    names.add(key);
    return true;
  });
}

// itunes' album search leaves out explicit albums and its song search misses some artists entirely
export async function searchMusic(term: string, country: StoreCountry) {
  const termWords = words(term);

  const [albums, tracks, artists] = await Promise.all([
    search(term, { entity: "album", limit: 25, country }),
    search(term, { entity: "song", limit: 25, country }),
    search(term, { entity: "musicArtist", limit: 10, country }),
  ]);

  const found = new Set(albums.results.map((album) => album.collectionId));
  const trackAlbumIds = new Set<number>();

  for (const track of tracks.results) {
    if (!found.has(track.collectionId) && covers(`${track.collectionName} ${track.artistName}`)) {
      trackAlbumIds.add(track.collectionId);
    }
  }

  const artistIds = artists.results
    .filter((artist) => sameWords(artist.artistName))
    .map((artist) => artist.artistId);

  const [trackAlbums, artistAlbums] = await Promise.all([
    lookupAlbums([...trackAlbumIds], country),
    lookupAlbums(artistIds, country, catalogLimit).then((albums) =>
      albums
        .filter((album) => artistIds.includes(album.artistId))
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)),
    ),
  ]);

  const byId = new Map<number, ResultAlbum>();

  for (const album of [...artistAlbums, ...trackAlbums, ...albums.results]) {
    if (!byId.has(album.collectionId)) byId.set(album.collectionId, album);
  }

  const rank = (album: ResultAlbum) => {
    const title = trimItunesCollectionPostfix(album.collectionName);

    const score =
      sameWords(title) || sameWords(album.artistName) ? 0 : covers(album.collectionName) ? 1 : 2;

    return score * 2 + (title === album.collectionName ? 0 : 1);
  };

  return {
    albums: mergeCatalogEditions([...byId.values()]).sort((a, b) => rank(a) - rank(b)),
    tracks: tracks.results,
  };

  function sameWords(text: string) {
    const textWords = words(text);

    return (
      textWords.length === termWords.length && textWords.every((word, i) => word === termWords[i])
    );
  }

  function covers(text: string) {
    const textWords = words(text);

    return termWords.length > 0 && termWords.every((word) => textWords.includes(word));
  }
}

const words = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

async function lookupAlbums(ids: number[], country: StoreCountry, limit?: number) {
  if (!ids.length) return [];

  try {
    // the api takes comma separated ids, the types only allow one
    const { results } = await lookup("id", ids.join(",") as unknown as number, {
      country,
      ...(limit && { entity: "album", limit }),
    });

    return (results as (ResultAlbum | ResultMusicArtist)[]).filter(
      (item): item is ResultAlbum =>
        item.wrapperType === "collection" && item.collectionType === "Album",
    );
  } catch {
    return [];
  }
}
