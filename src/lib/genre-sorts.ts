import type { Genre } from "#lib/api/platforms/everynoise-data";
import { sortHexColorsToGradient } from "#lib/color-sort";
import type { genreSorts } from "../routes.ts";

export type GenreSort = (typeof genreSorts)[number];

export const sorts: readonly {
  value: GenreSort;
  label: string;
  apply: (genres: Genre[]) => Genre[];
}[] = [
  { value: "popularity", label: "top", apply: (genres) => genres },
  {
    value: "alphabetical",
    label: "a-z",
    apply: (genres) => [...genres].sort((a, b) => a.genreName.localeCompare(b.genreName)),
  },
  {
    value: "color",
    label: "clr",
    apply: (genres) => sortHexColorsToGradient(genres, (genre) => genre.style.color),
  },
];

export const sortOf = (value: GenreSort) => sorts.find((sort) => sort.value === value) ?? sorts[0]!;

export const nextSortOf = (value: GenreSort) =>
  sorts[(sorts.indexOf(sortOf(value)) + 1) % sorts.length]!;
