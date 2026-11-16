import { getArtistImages as getCachedArtistImages } from "./apple-music.server";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

// profile picture and custom name logo ("artist typography") from an itunes artist id
export const getArtistImages = createServerFn()
  .validator(v.number())
  .handler(({ data }) =>
    getCachedArtistImages(data, storeCountryFromLanguages(getRequestHeader("accept-language"))),
  );
