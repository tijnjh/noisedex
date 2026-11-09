import { storeCountryFromLanguages } from "#lib/store-country";
import {
  albumDetails,
  artistReleases,
  searchArtists,
  searchCatalog,
  spotifyGet,
  SpotifyNotFoundError,
} from "./spotify-catalog.server";
import type { SpotifyArtist, SpotifyTrack } from "./spotify-data";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

const spotifyId = v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{22}$/));
const market = () =>
  storeCountryFromLanguages(getRequestHeader("accept-language")).toUpperCase();

export const lookupArtists = createServerFn()
  .validator(v.string())
  .handler(({ data }) => searchArtists(data, market()));
export const getArtistById = createServerFn()
  .validator(spotifyId)
  .handler(({ data }) => spotifyGet<SpotifyArtist>(`artists/${data}`));
export const getArtistReleases = createServerFn()
  .validator(spotifyId)
  .handler(({ data }) => artistReleases(data, market()));
export const searchMusic = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const result = await searchCatalog(data, market());
    return { albums: result.albums.items, tracks: result.tracks.items };
  });
export const getAlbum = createServerFn()
  .validator(spotifyId)
  .handler(async ({ data }) => {
    try {
      return await albumDetails(data, market());
    } catch (error) {
      if (error instanceof SpotifyNotFoundError) return null;
      throw error;
    }
  });
export const getTrack = createServerFn()
  .validator(spotifyId)
  .handler(async ({ data }) => {
    try {
      return await spotifyGet<SpotifyTrack>(
        `tracks/${data}?market=${market()}`,
      );
    } catch (error) {
      if (error instanceof SpotifyNotFoundError) return null;
      throw error;
    }
  });
