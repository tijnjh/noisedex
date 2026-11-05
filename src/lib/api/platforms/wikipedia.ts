import { createServerFn } from "@tanstack/react-start";
import ky from "ky";
import * as v from "valibot";

export const wikipediaKy = ky.create({
  baseUrl: "https://en.wikipedia.org",
});

export const wikipediaRestKy = wikipediaKy.extend({
  prefix: "/api/rest_v1",
});

export const wikipediaPhpKy = wikipediaKy.extend({
  prefix: "/w/api.php",
});

type ArtistSummary = {
  title: string;
  type: string;
  description?: string;
  extract: string;
};

export const getArtistByName = createServerFn()
  .validator(v.string())
  .handler(async ({ data: artistName }) => {
    const name = artistName.trim();
    if (!name) return;

    const { query } = await wikipediaPhpKy("", {
      searchParams: {
        action: "query",
        list: "search",
        srsearch: `${name} music`,
        srlimit: 10,
        srprop: "",
        format: "json",
        origin: "*",
      },
    }).json<{ query: { search: { title: string }[] } }>();

    for (const { title } of query.search) {
      if (title.replace(/ \(.*\)$/, "").toLowerCase() !== name.toLowerCase())
        continue;

      const summary = await wikipediaRestKy(
        `/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
      ).json<ArtistSummary>();

      if (
        summary.type === "standard" &&
        /\b(band|musician|singer|rapper|songwriter|composer|record producer|DJ|musical (group|duo|trio)|orchestra)\b/i.test(
          summary.description ?? summary.extract.split(". ")[0],
        )
      )
        return summary;
    }
  });
