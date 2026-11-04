import genres from "../data/genres.gen.csv?raw";
import { createServerOnlyFn } from "@tanstack/react-start";
import CSV from "papaparse";

export const getAllGenres_serverOnly = createServerOnlyFn(
  () => CSV.parse(genres, { header: true }).data as Everynoise.Genre[],
);

// some platforms word the genres a little differently so this mapping tries to convert them to their evernoise equivalent
const commonMappings = [["alt-", "alternative"]] as const;

export const isValidGenre = createServerOnlyFn((genreName: string) => {
  const genres = getAllGenres_serverOnly();

  const replaced = new Set<string>();

  for (const [from, to] of commonMappings) {
    replaced.add(genreName.replace(from, to));
  }

  return genres.filter((genre) => replaced.has(genre.genreName));
});
