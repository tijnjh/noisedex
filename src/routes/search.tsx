import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { $itunes } from "#lib/api/index";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { siteName } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import * as v from "valibot";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: `Search artists, albums, and tracks | ${siteName}` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  validateSearch: v.object({
    q: v.optional(v.string()),
    lucky: v.optional(v.boolean()),
  }),

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ deps: { search } }) => {
    const query = search.q?.trim();
    if (!query) return;
    const [artists, music] = await Promise.all([
      $itunes.searchArtists({ data: query }),
      search.lucky
        ? Promise.resolve({ albums: [], tracks: [] })
        : $itunes.searchMusic({ data: query }),
    ]);

    if (search.lucky && artists.length) {
      const topResultId = artists[0].artistId;

      throw redirect({
        to: "/$itunesId",
        params: { itunesId: encodeItunesId(topResultId) },
        replace: true,
      });
    }

    return {
      artists,
      ...(search.lucky ? await $itunes.searchMusic({ data: query }) : music),
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const data = Route.useLoaderData();

  return (
    <Layout header={{ title: "search" }}>
      {search.q?.trim() && (
        <div
          data-scroll-restoration-id={scrollRegions.content}
          className="flex h-full flex-col gap-3 overflow-y-auto p-3"
        >
          {!!data?.artists.length && (
            <section className="flex flex-col gap-3" aria-label="Artists">
              <h2 className="section-divider">artists</h2>
              <div className="cool-grid">
                {data?.artists.map((artist) => (
                  <Chip
                    key={artist.artistId}
                    vt={{ title: `artist-${artist.artistId}` }}
                    to="/$itunesId"
                    params={{ itunesId: encodeItunesId(artist.artistId) }}
                  >
                    {artist.artistName}
                  </Chip>
                ))}
              </div>
            </section>
          )}
          {!!data?.albums.length && (
            <section className="flex flex-col gap-3" aria-label="Albums">
              <h2 className="section-divider">albums</h2>
              <div className="cool-grid">
                {data.albums.map((album) => (
                  <MusicChip key={album.collectionId} music={album} showArtist />
                ))}
              </div>
            </section>
          )}
          {!!data?.tracks.length && (
            <section className="flex flex-col gap-3" aria-label="Tracks">
              <h2 className="section-divider">tracks</h2>
              <div className="cool-grid">
                {data.tracks.map((track) => (
                  <MusicChip key={track.trackId} music={track} showArtist />
                ))}
              </div>
            </section>
          )}
          {!data?.artists.length && !data?.albums.length && !data?.tracks.length && (
            <p role="status">No artists, albums, or tracks found.</p>
          )}
        </div>
      )}
    </Layout>
  );
}
