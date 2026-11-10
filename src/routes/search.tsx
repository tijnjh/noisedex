import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { $itunes } from "#lib/api/index";
import { siteName } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
        to: "/artist/$itunesId",
        params: { itunesId: String(topResultId) },
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
  const navigate = Route.useNavigate();
  const data = Route.useLoaderData();

  const [searchTerm, setSearchTerm] = useState(search.q ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchTerm(search.q ?? ""); // FIXME
  }, [search.q]);

  return (
    <Layout
      header={{
        title: "search",
        children: (
          <form
            className="flex grow gap-3 md:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const query = searchTerm.trim();
              if (!query) return;
              navigate({
                to: "/search",
                search: {
                  q: query,
                },
              });
            }}
          >
            <input
              value={searchTerm ?? ""}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              required
              aria-label="Search artists, albums, and tracks"
              className="h-9 min-w-0 grow px-3 surface"
              name="q"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="look up an artist, album, or track"
            />

            <button
              type="submit"
              aria-label="Search"
              className="btn-inverse size-9 justify-center"
            >
              →
            </button>
          </form>
        ),
      }}
    >
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
                    to="/artist/$itunesId"
                    params={{ itunesId: String(artist.artistId) }}
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
                  <MusicChip
                    key={album.collectionId}
                    music={album}
                    showArtist
                  />
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
          {!data?.artists.length &&
            !data?.albums.length &&
            !data?.tracks.length && (
              <p role="status">No artists, albums, or tracks found.</p>
            )}
        </div>
      )}
    </Layout>
  );
}
