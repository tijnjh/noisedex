import {
  getArtistCatalog,
  lookupCatalogSongs,
  searchCatalogArtists,
  searchCatalogMusic,
} from "#lib/api/platforms/itunes-catalog";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type * as serverIsa from "itunes-store-api";
import * as v from "valibot";

export const searchMusic = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const country = storeCountryFromLanguages(getRequestHeader("accept-language"));
    return searchCatalogMusic(data.trim(), country);
  });

export const searchArtists = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const country = storeCountryFromLanguages(getRequestHeader("accept-language"));
    return searchCatalogArtists(data.trim(), country);
  });

export const getMusic = createServerFn()
  .validator(v.number())
  .handler(async ({ data: id }) => {
    const country = storeCountryFromLanguages(getRequestHeader("accept-language"));
    const results = await lookupCatalogSongs(id, country);
    const result = results[0];

    if (result?.wrapperType === "artist" && result.artistId === id) {
      const catalog = await getArtistCatalog(id, country);
      if (!catalog) return;

      return { type: "artist" as const, ...catalog };
    }

    if (
      result?.wrapperType === "collection" &&
      result.collectionType === "Album" &&
      result.collectionId === id
    ) {
      const tracks = results.filter(
        (item): item is serverIsa.ResultMusicTrack =>
          item.wrapperType === "track" && item.kind === "song",
      );

      return { type: "album" as const, album: result, tracks };
    }

    if (result?.wrapperType === "track" && result.kind === "song" && result.trackId === id) {
      return { type: "track" as const, track: result };
    }
  });
