import { siteUrl } from "#lib/constants";
import { getGenreCatalog } from "#lib/genre-catalog";
import { genreSlugs } from "#lib/genres";
import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = [
          "/",
          ...genreSlugs(getGenreCatalog()).map((slug) => `/genre/${slug}`),
        ];
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
