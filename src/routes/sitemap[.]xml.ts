import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { getAllGenres } from "#lib/api/platforms/everynoise.server";
import { siteUrl } from "#lib/constants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const genreSlugs = [
          ...new Set(
            await getAllGenres().then((r) =>
              r
                .map((genre) => genreNameToSlug(genre.genreName))
                .filter(Boolean),
            ),
          ),
        ];
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
