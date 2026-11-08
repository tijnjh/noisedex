import { readGenreElement } from "#lib/api/platforms/everynoise-html";
import { scrappy } from "#lib/scrappy";
import everynoiseHtml from "../data/everynoise.html?raw";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { cwd } from "node:process";
import * as CSV from "papaparse";

const $ = scrappy({ html: everynoiseHtml });

const genres = $(".genre")
  .map((_, e) => readGenreElement($(e)))
  .get();

await writeFile(
  path.join(cwd(), "src", "data", "genres.gen.csv"),
  CSV.unparse(genres),
);
