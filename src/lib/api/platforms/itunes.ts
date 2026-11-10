import {
  getArtistCatalog,
  lookupCatalogSongs,
} from "#lib/api/platforms/itunes-catalog";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as serverIsa from "itunes-store-api";
import * as v from "valibot";

export const searchMusic = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const country = storeCountryFromLanguages(
      getRequestHeader("accept-language"),
    );
    const [albums, tracks] = await Promise.all([
      serverIsa.search(data, {
        media: "music",
        entity: "album",
        limit: 25,
        country,
      }),
      serverIsa.search(data, {
        media: "music",
        entity: "song",
        limit: 25,
        country,
      }),
    ]);

    return { albums: albums.results, tracks: tracks.results };
  });

export const searchArtists = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const country = storeCountryFromLanguages(
      getRequestHeader("accept-language"),
    );
    const response = await serverIsa.search(data, {
      media: "music",
      entity: "musicArtist",
      limit: 25,
      country,
    });

    return response.results.filter(
      (result): result is serverIsa.ResultMusicArtist =>
        result.wrapperType === "artist",
    );
  });

export const getArtistById = createServerFn()
  .validator(v.number())
  .handler(async ({ data: artistId }) => {
    const country = storeCountryFromLanguages(
      getRequestHeader("accept-language"),
    );
    const response = await serverIsa.lookup("id", artistId, {
      media: "music",
      entity: "musicArtist",
      country,
    });
    const artist = response.results.find(
      (result): result is serverIsa.ResultMusicArtist =>
        result.wrapperType === "artist",
    );

    if (!artist) return null;

    return {
      artist,
      albums: await getArtistCatalog(artistId, country),
    };
  });

export const getAlbumsByArtistName = createServerFn()
  .validator(v.string())
  .handler(async ({ data: artistName }) => {
    const country = storeCountryFromLanguages(
      getRequestHeader("accept-language"),
    );
    const artists = await serverIsa
      .search(artistName, {
        media: "music",
        entity: "musicArtist",
        country,
      })
      .then((response) => response.results);
    const artistId = artists.find(
      (artist) => artist.artistName.toLowerCase() === artistName.toLowerCase(),
    )?.artistId;

    if (!artistId)
      return {
        artistId,
        albums: [],
      };

    const albums = await getArtistCatalog(artistId, country);

    return { artistId, albums };
  });

const lookupSongsOnServer = createServerFn()
  .validator(v.number())
  .handler(({ data }) =>
    lookupCatalogSongs(
      data,
      storeCountryFromLanguages(getRequestHeader("accept-language")),
    ),
  );

export async function getAlbum(id: number) {
  const results = await lookupSongsOnServer({ data: id });
  const album = results[0];
  if (album?.wrapperType !== "collection" || album.collectionType !== "Album")
    return null;
  const tracks = results.filter(
    (result): result is serverIsa.ResultMusicTrack =>
      result.wrapperType === "track",
  );
  return { album, tracks };
}

export async function getTrack(id: number) {
  const results = await lookupSongsOnServer({ data: id });
  return (
    results.find(
      (result): result is serverIsa.ResultMusicTrack =>
        result.wrapperType === "track" &&
        result.kind === "song" &&
        result.trackId === id,
    ) ?? null
  );
}
