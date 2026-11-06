import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { $spotify } from "#lib/api/index";
import { siteName } from "#lib/constants";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as v from "valibot";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: `Search artists | ${siteName}` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  validateSearch: v.object({
    q: v.optional(v.string()),
    // like googles "feeling lucky" button it will auto open the first result
    lucky: v.optional(v.boolean()),
  }),

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ deps: { search } }) => {
    const query = search.q?.trim();
    if (!query) return;
    const artists = await $spotify.lookupArtists({ data: query });

    if (search.lucky && artists.length) {
      const topResultId = artists[0].id;

      throw redirect({
        to: "/artist/$spotifyId",
        params: { spotifyId: topResultId },
        replace: true,
      });
    }

    return { artists };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const data = Route.useLoaderData();

  const [searchTerm, setSearchTerm] = useState(search.q ?? "");

  useEffect(() => {
    setSearchTerm(search.q ?? "");
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
              aria-label="Search artists"
              className="h-9 min-w-0 grow bg-zinc-50-950 px-3"
              name="q"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="look up an artist"
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
          data-scroll-restoration-id="content"
          className="h-full overflow-y-auto p-3"
        >
          {data?.artists.length ? (
            <div className="cool-grid">
              {data?.artists.map((artist) => (
                <Chip
                  key={artist.id}
                  to="/artist/$spotifyId"
                  leading={artist.images.at(-1)?.url}
                  params={{ spotifyId: artist.id }}
                >
                  {artist.name}
                </Chip>
              ))}
            </div>
          ) : (
            <p role="status">No artists found.</p>
          )}
        </div>
      )}
    </Layout>
  );
}
