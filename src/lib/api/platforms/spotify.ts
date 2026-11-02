import { createArtists } from "#lib/artists";
import { createGenrePages } from "#lib/genres";
import { directItunes } from "#lib/itunes";
import { createReleases } from "#lib/releases";
import { createSpotify } from "#lib/spotify";
import { createServerFn } from "@tanstack/solid-start";
import * as v from "valibot";

let artists: ReturnType<typeof createArtists> | undefined;

// created lazily so the spotify token cache only ever lives on the server
const serverArtists = () =>
  (artists ??= createArtists({
    spotify: createSpotify(),
    // this runs on the server, so no need for the ios proxy
    getArtistReleases: createReleases(directItunes).getArtistReleases,
    getArtistGenres: createGenrePages().getArtistGenres,
  }));

/** a spotify artist, plus their itunes releases and everynoise genres */
export const getArtist = createServerFn()
  .validator(v.string())
  .handler(({ data: spotifyId }) => serverArtists().resolve(spotifyId));

export const searchArtists = createServerFn()
  .validator(v.string())
  .handler(({ data: query }) => serverArtists().search(query));

export const findBestArtistMatch = createServerFn()
  .validator(v.string())
  .handler(({ data: query }) => serverArtists().findBestMatch(query));
