import { getMappedArtistIds } from "#lib/api/platforms/everynoise.server";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { artistSitemapCount, sitemapUrlLimit, urlsetResponse } from "#lib/sitemap.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemaps/artists-{$page}.xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const artistIds = await getMappedArtistIds();

        const page = /^[1-9]\d*$/.test(params.page) ? Number(params.page) : 0;

        if (page < 1 || page > artistSitemapCount(artistIds.length)) {
          return new Response("Not found", { status: 404 });
        }

        const chunk = artistIds.slice((page - 1) * sitemapUrlLimit, page * sitemapUrlLimit);

        return urlsetResponse(chunk.map((id) => `/${encodeItunesId(id)}`));
      },
    },
  },
});
