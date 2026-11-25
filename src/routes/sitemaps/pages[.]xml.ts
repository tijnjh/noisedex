import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { getAllGenres } from "#lib/api/platforms/everynoise.server";
import { urlsetResponse } from "#lib/sitemap.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemaps/pages.xml")({
  server: {
    handlers: {
      GET: async () => {
        const genres = await getAllGenres();

        const genreSlugs = new Set(genres.map((genre) => genreNameToSlug(genre.genreName)));

        return urlsetResponse(["/", ...Array.from(genreSlugs, (slug) => `/genre/${slug}`)]);
      },
    },
  },
});
