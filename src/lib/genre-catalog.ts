import csv from "../data/genres.gen.csv?raw";
import { type Genre, parseGenreCatalog } from "./genres";
import { createServerOnlyFn } from "@tanstack/solid-start";

let catalog: Genre[] | undefined;

/** every everynoise genre, in popularity order. parsed once per server. */
export const getGenreCatalog = createServerOnlyFn(
  () => (catalog ??= parseGenreCatalog(csv)),
);
