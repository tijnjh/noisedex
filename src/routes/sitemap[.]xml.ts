import { siteUrl } from "#lib/constants";
import { genreNameToSlug } from "#lib/utils";
import genresCsv from "../data/genres.gen.csv?raw";
import { createFileRoute } from "@tanstack/react-router";
import CSV from "papaparse";

const genreSlugs = [
  ...new Set(
    CSV.parse<{ genreName: string }>(genresCsv, { header: true })
      .data.map((genre) => genreNameToSlug(genre.genreName))
      .filter((slug): slug is string => Boolean(slug)),
  ),
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = ["/", ...genreSlugs.map((slug) => `/genre/${slug}`)];
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((path) => `<url><loc>${siteUrl}${path}</loc></url>`)
          .join("\n")}\n</urlset>`;

        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
