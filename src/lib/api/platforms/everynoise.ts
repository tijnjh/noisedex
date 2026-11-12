import * as server from "./everynoise.server";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

export type * from "./everynoise-types";

export const getAllGenres = createServerFn().handler(() => server.getAllGenres());

const genreBySlug = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.getGenreBySlug(data));
const artistById = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.getArtistById(data));
const artistByName = createServerFn()
  .validator(v.string())
  .handler(({ data }) => server.getArtistByName(data));

export const getGenreBySlug = (slug: string) => genreBySlug({ data: slug });
export const getArtistById = (id: string) => artistById({ data: id });
export const getArtistByName = (name: string) => artistByName({ data: name.trim().toLowerCase() });
