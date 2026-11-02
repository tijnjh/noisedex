import { getGenreCatalog } from "#lib/genre-catalog";
import { createGenrePages } from "#lib/genres";
import { createServerFn } from "@tanstack/solid-start";
import * as v from "valibot";

export const getAllGenres = createServerFn().handler(() => getGenreCatalog());

export const getGenrePage = createServerFn()
  .validator(v.string())
  .handler(({ data: slug }) => createGenrePages().getBySlug(slug));
