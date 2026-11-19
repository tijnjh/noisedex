import * as catalog from "./itunes-catalog";
import * as server from "./itunes.server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { isbot } from "isbot";

// crawlers get server rendered (and cached) pages, people fetch from itunes in their own browser
export const ssrForCrawlers = createIsomorphicFn()
  .server(() => isbot(getRequestHeader("user-agent")))
  .client(() => false);

// the store of the most preferred language's region, like "nl" for "nl-NL,en" or "us" for "en"
function storeCountry(languages = "") {
  try {
    const region = new Intl.Locale(languages.split(/[,;]/)[0]).maximize().region;
    if (region && /^[A-Z]{2}$/.test(region)) return region.toLowerCase() as catalog.StoreCountry;
  } catch {}
  return "us";
}

const source = createIsomorphicFn()
  .server(() => ({ api: server, country: storeCountry(getRequestHeader("accept-language")) }))
  .client(() => ({ api: catalog, country: storeCountry(navigator.language) }));

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
