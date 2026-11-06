import { getGenres, getSummary } from "./wikipedia.server";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export interface WikipediaSummary {
  title: string;
  extract: string;
  url: string;
}

export const getArtistByName = createServerFn()
  .validator(v.string())
  .handler(({ data }) => getSummary({ kind: "artist", name: data }));

export const getGenreByName = createServerFn()
  .validator(v.string())
  .handler(({ data }) => getSummary({ kind: "genre", name: data }));

export const getAlbumByName = createServerFn()
  .validator(v.object({ album: v.string(), artist: v.string() }))
  .handler(({ data }) =>
    getSummary({ kind: "album", name: data.album, artist: data.artist }),
  );

export const getGenresByTitle = createServerFn()
  .validator(v.string())
  .handler(({ data }) => getGenres(data));
