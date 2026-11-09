import { isIos } from "#lib/utils";
import { createServerFn } from "@tanstack/react-start";
import * as serverIsa from "itunes-store-api";
import * as v from "valibot";

export const searchMusic = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const [albums, tracks] = await Promise.all([
      serverIsa.search(data, { media: "music", entity: "album", limit: 25 }),
      serverIsa.search(data, { media: "music", entity: "song", limit: 25 }),
    ]);

    return { albums: albums.results, tracks: tracks.results };
  });

export const getAlbumsByArtistName = createServerFn()
  .validator(v.string())
  .handler(async ({ data: artistName }) => {
    const artists = await serverIsa
      .search(artistName, {
        media: "music",
        entity: "musicArtist",
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

    const albums = await serverIsa
      .lookup("id", artistId, {
        media: "music",
        entity: "album",
      })
      .then((response) =>
        response.results.filter(
          (result): result is serverIsa.ResultAlbum =>
            result.wrapperType === "collection",
        ),
      );

    return { artistId, albums };
  });

// apple added some crazy redirect stuff with this api on on ios so i have to do it server side on there
const lookupSongsOnServer = createServerFn()
  .validator(v.number())
  .handler(({ data }) => lookupSongs(data));

async function lookupSongs(id: number) {
  const response = await serverIsa.lookup("id", id, {
    media: "music",
    entity: "song",
  });
  return response.results as Array<
    serverIsa.ResultAlbum | serverIsa.ResultMusicTrack
  >;
}

async function musicResults(id: number) {
  return isIos() ? lookupSongsOnServer({ data: id }) : lookupSongs(id);
}

export async function getAlbum(id: number) {
  const results = await musicResults(id);
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
  const results = await musicResults(id);
  return (
    results.find(
      (result): result is serverIsa.ResultMusicTrack =>
        result.wrapperType === "track" &&
        result.kind === "song" &&
        result.trackId === id,
    ) ?? null
  );
}
