import { directItunes, type ItunesClient } from "#lib/itunes";
import { createReleases } from "#lib/releases";
import { createServerFn } from "@tanstack/solid-start";
import * as v from "valibot";

const proxyLookupWithSongs = createServerFn()
  .validator(v.number())
  .handler(({ data }) => directItunes.lookupWithSongs(data));

const proxySearchArtists = createServerFn()
  .validator(v.string())
  .handler(({ data }) => directItunes.searchArtists(data));

const proxyLookupArtistAlbums = createServerFn()
  .validator(v.number())
  .handler(({ data }) => directItunes.lookupArtistAlbums(data));

// apple added some crazy redirect stuff to this api on ios, so there it has
// to go through the server
const proxiedItunes: ItunesClient = {
  lookupWithSongs: (id) => proxyLookupWithSongs({ data: id }),
  searchArtists: (term) => proxySearchArtists({ data: term }),
  lookupArtistAlbums: (id) => proxyLookupArtistAlbums({ data: id }),
};

function isIos() {
  if (typeof navigator === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// everywhere else itunes can be called straight from the client
const deviceItunes = (): ItunesClient =>
  isIos() ? proxiedItunes : directItunes;

export const releases = createReleases({
  lookupWithSongs: (id) => deviceItunes().lookupWithSongs(id),
  searchArtists: (term) => deviceItunes().searchArtists(term),
  lookupArtistAlbums: (id) => deviceItunes().lookupArtistAlbums(id),
});
