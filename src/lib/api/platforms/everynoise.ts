import * as server from "./everynoise.server";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export type * from "./everynoise-types";

export const getAllGenres = createServerFn().handler(() => server.getAllGenres());

export const getGenreBySlug = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.getGenreBySlug(data));

export const findSimilarGenres = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.findSimilarGenres(data));

export const getArtistByName = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.getArtistByName(data));
