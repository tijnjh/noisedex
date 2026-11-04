import { Scrappy } from "#lib/scrappy";
import { isValidGenre } from "#lib/server-only";
import { createServerFn } from "@tanstack/react-start";
import ky from "ky";
import * as v from "valibot";

export const lastFmKy = ky.create({
  baseUrl: "https://last.fm",
});

const baseUrl = "https://last.fm";

export const getAlbumTags = createServerFn()
  .validator(
    v.object({
      artist: v.string(),
      album: v.string(),
    }),
  )
  .handler(async ({ data }) => {
    const scrappy = await Scrappy.init(
      `${baseUrl}/music/${data.artist}/${data.album}`,
    );

    const tagEls = scrappy.find(".catalogue-tags")?.findAll(".tag");

    const tags = tagEls?.map((el) => el.textContent) ?? [];

    return tags.filter(isValidGenre);
  });
