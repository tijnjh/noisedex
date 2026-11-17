import { cached } from "../../cache.server";
import * as catalog from "./itunes-catalog";

export const getMusic = cached(catalog.getMusic);
export const searchArtists = cached(catalog.searchArtists);
export const searchMusic = cached(catalog.searchMusic);
