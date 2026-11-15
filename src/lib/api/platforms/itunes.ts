import {
  getArtistCatalog,
  lookupCatalogSongs,
  searchCatalogArtists,
  searchCatalogMusic,
} from "#lib/api/platforms/itunes-catalog";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type * as itunes from "itunes-store-api";
import * as v from "valibot";

// the store to query, picked from the visitor's preferred languages
const requestCountry = () => storeCountryFromLanguages(getRequestHeader("accept-language"));

export const searchMusic = createServerFn()
  .validator(v.string())
  .handler(({ data }) => searchCatalogMusic(data.trim(), requestCountry()));

export const searchArtists = createServerFn()
  .validator(v.string())
  .handler(({ data }) => searchCatalogArtists(data.trim(), requestCountry()));

export const getMusic = createServerFn()
  .validator(v.number())
  .handler(async ({ data: id }) => {
    const country = requestCountry();
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
        (item): item is itunes.ResultMusicTrack =>
          item.wrapperType === "track" && item.kind === "song",
      );

      return { type: "album" as const, album: result, tracks };
    }

    if (result?.wrapperType === "track" && result.kind === "song" && result.trackId === id) {
      return { type: "track" as const, track: result };
    }
  });
