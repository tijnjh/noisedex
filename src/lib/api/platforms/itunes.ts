import { isIos } from "#lib/utils";
import { createServerFn } from "@tanstack/react-start";
import * as serverIsa from "itunes-store-api";
import * as v from "valibot";

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
const proxyItunes = createServerFn()
  .validator(
    (
      data:
        | ["search", ...Parameters<typeof serverIsa.search>]
        | ["lookup", ...Parameters<typeof serverIsa.lookup>],
    ) => data,
  )

  .handler(({ data }) => {
    switch (data[0]) {
      case "search": {
        const [, search, options] = data;
        return serverIsa.search(search, options);
      }
      case "lookup": {
        const [, type, value, options] = data;
        return serverIsa.lookup(type, value, options);
      }
    }
  });

// more typed wrapper
const proxied: {
  search: typeof serverIsa.search;
  lookup: typeof serverIsa.lookup;
} = {
  search: (search, options) =>
    // @ts-expect-error
    proxyItunes({ data: ["search", search, options] }),
  lookup: (type, value, options) =>
    // @ts-expect-error ffs these overloads bro
    proxyItunes({ data: ["lookup", type, value, options] }),
};

// if not on ios you can just call itunes from the client directly
export const isa = isIos() ? proxied : serverIsa;
