import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { $spotify } from "#lib/api/index";
import { siteName } from "#lib/constants";
import { createFileRoute, redirect } from "@tanstack/solid-router";
import { createSignal, For, Show } from "solid-js";
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
    if (!search.q) return;

    if (search.lucky) {
      const best = await $spotify.findBestArtistMatch({ data: search.q });
      if (best)
        throw redirect({
          to: "/artist/$spotifyId",
          params: { spotifyId: best.id },
          replace: true,
        });

      // nothing to be lucky with; show the (empty) results instead
      return { artists: [] };
    }

    return { artists: await $spotify.searchArtists({ data: search.q }) };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const data = Route.useLoaderData();

  const [searchTerm, setSearchTerm] = createSignal<string>();

  return (
    <Layout
      header={{
        title: "search",
        children: (
          <form
            class="flex grow gap-3 md:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({
                to: "/search",
                search: {
                  q: searchTerm(),
                },
              });
            }}
          >
            <input
              value={searchTerm() ?? ""}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              required
              class="h-9 min-w-0 grow bg-zinc-50-950 px-3"
              name="q"
              placeholder="look up an artist"
            />

            <button type="submit" class="btn-inverse size-9 justify-center">
              →
            </button>
          </form>
        ),
      }}
    >
      <Show when={search().q}>
        <Show
          when={data()?.artists.length}
          fallback={<p class="p-3 opacity-60">No artists found.</p>}
        >
          <div class="cool-grid h-full p-3">
            <For each={data()?.artists}>
              {(artist) => (
                <Chip
                  to="/artist/$spotifyId"
                  leading={artist.imageUrl}
                  params={{ spotifyId: artist.id }}
                >
                  {artist.name}
                </Chip>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </Layout>
  );
}
