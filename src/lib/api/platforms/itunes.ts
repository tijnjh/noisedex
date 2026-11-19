import * as catalog from "./itunes-catalog";
import * as server from "./itunes.server";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { isbot } from "isbot";

// crawlers get server rendered (and cached) pages, people fetch from itunes in their own browser
export const ssrForCrawlers = createIsomorphicFn()
  .server(() => isbot(getRequestHeader("user-agent")))
  .client(() => false);

const source = createIsomorphicFn()
  .server(() => ({
    api: server,
    country: storeCountryFromLanguages(getRequestHeader("accept-language")),
  }))
  .client(() => ({
    api: catalog,
    country: storeCountryFromLanguages(navigator.languages.join(",")),
  }));

export const getMusic = (id: number) => {
  const { api, country } = source();
  return api.getMusic(id, country);
};

export const searchArtists = (name: string) => {
  const { api, country } = source();
  return api.searchArtists(name, country);
};

export const searchMusic = (term: string) => {
  const { api, country } = source();
  return api.searchMusic(term, country);
};
