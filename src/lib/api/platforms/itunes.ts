import * as catalog from "./itunes-catalog";
import * as server from "./itunes.server";
import { storeCountryFromLanguages, type StoreCountry } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

const requestCountry = () => storeCountryFromLanguages(getRequestHeader("accept-language"));

const serverGetMusic = createServerFn()
  .validator(v.number())
  .handler(({ data }) => server.getMusic(data, requestCountry()));

const serverSearchArtists = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.searchArtists(data, requestCountry()));

const serverSearchMusic = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.searchMusic(data, requestCountry()));

async function withBrowserFallback<T>(
  fromServer: () => Promise<T>,
  fromBrowser: (country: StoreCountry) => Promise<T>,
) {
  try {
    return await fromServer();
  } catch (error) {
    if (typeof window === "undefined") throw error;
    return fromBrowser(storeCountryFromLanguages(navigator.languages.join(",")));
  }
}

export const getMusic = (id: number) =>
  withBrowserFallback(
    () => serverGetMusic({ data: id }),
    (country) => catalog.getMusic(id, country),
  );

export const searchArtists = (name: string) =>
  withBrowserFallback(
    () => serverSearchArtists({ data: name }),
    (country) => catalog.searchArtists(name, country),
  );

export const searchMusic = (term: string) =>
  withBrowserFallback(
    () => serverSearchMusic({ data: term }),
    (country) => catalog.searchMusic(term, country),
  );
