import { scrappy } from "#lib/scrappy";
import { getGenreCatalog } from "./everynoise-catalog.server";
import {
  everynoiseUrl,
  genreNameToSlug,
  trimLinkPostfix,
} from "./everynoise-data";
import { readGenreElement } from "./everynoise-html";
import { createServerFn } from "@tanstack/react-start";
import ky from "ky";
import * as v from "valibot";

export const getAllGenres = createServerFn().handler(getGenreCatalog);

export const getGenreBySlug = createServerFn()
  .validator(v.string())
  .handler(async ({ data: genreSlug }) => {
    const $ = await scrappy({
      url: `${everynoiseUrl}/engenremap-${genreSlug}.html`,
    });

    const titleEl = $(".title");

    const genreName = titleEl.text().slice(22).split("\n")[0];

    const canvas = $('.canvas[role="main"]');

    const artists = canvas
      .find(".genre")
      .map((_, el) => ({
        artistName: trimLinkPostfix($(el).text()),
        id:
          new URL(
            $(el).find("a").attr("href") ?? "",
            everynoiseUrl,
          ).searchParams.get("id") ?? undefined,
        color: $(el).css("color"),
        previewUrl: $(el).attr("preview_url"),
        previewTitle: $(el).attr("title"),
      }))
      .get()
      .filter(
        (artist): artist is typeof artist & { id: string } =>
          !!artist.id && /^[a-zA-Z0-9]{22}$/.test(artist.id),
      );

    const links = titleEl
      .find("a")
      .map((_, el) => ({
        text: $(el).text(),
        href: new URL($(el).attr("href")!, everynoiseUrl).href,
      }))
      .get();

    const relatedCanvas = $("#tunnel .canvas");

    const relatedGenres = relatedCanvas
      .find(".genre")
      .map((_, el) => readGenreElement($(el)))
      .get()
      .filter((g) => g.genreName !== genreName);

    return { genreName, artists, links, relatedGenres };
  });

export const getGenresByArtistId = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const res = await ky
      .get(`${everynoiseUrl}/api/${data}`)
      .text()
      .then(JSON.parse);

    return (Object.values(res)[0] as string[]) ?? [];
  });
