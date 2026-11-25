import { getMappedArtistIds } from "#lib/api/platforms/everynoise.server";
import { artistSitemapCount, artistSitemapPath, sitemapIndexResponse } from "#lib/sitemap.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // still serve the pages sitemap if the mappings fail to load
        const artistIds = await getMappedArtistIds().catch(() => []);

        const artistPages = Array.from({ length: artistSitemapCount(artistIds.length) }, (_, i) =>
          artistSitemapPath(i + 1),
        );

        return sitemapIndexResponse(["/sitemaps/pages.xml", ...artistPages]);
      },
    },
  },
});
