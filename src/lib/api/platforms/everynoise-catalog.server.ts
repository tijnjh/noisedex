import genresCsv from "../../../data/genres.gen.csv?raw";
import type { Genre } from "./everynoise-data";
import { createServerOnlyFn } from "@tanstack/react-start";
import CSV from "papaparse";

const genres = CSV.parse<Genre>(genresCsv, { header: true }).data;
export const getGenreCatalog = createServerOnlyFn(() => genres);
