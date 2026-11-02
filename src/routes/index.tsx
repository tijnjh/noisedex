import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { VirtualGrid } from "#components/virtual-grid";
import { $everynoise } from "#lib/api/index";
import { siteUrl } from "#lib/constants";
import {
  filterGenres,
  type GenreFilter,
  type GenreSort,
  genreSlug,
  sortGenres,
} from "#lib/genres";
import { createFileRoute } from "@tanstack/solid-router";
import { createMemo } from "solid-js";
import * as v from "valibot";

const filters = ["genre", "preview"] as const satisfies GenreFilter[];
const sorts = [
  "popularity",
  "alphabetical",
  "color",
] as const satisfies GenreSort[];

const placeholders: Record<GenreFilter, string> = {
  genre: "filter genre names",
  preview: "filter genre preview track name",
};

export const Route = createFileRoute("/")({
  // the url is the only state, so back/forward and shared links just work
  validateSearch: v.object({
    q: v.fallback(v.optional(v.string()), undefined),
    type: v.fallback(v.optional(v.picklist(filters)), undefined),
    sort: v.fallback(v.optional(v.picklist(sorts)), undefined),
  }),
  loader: async () => ({ genres: await $everynoise.getAllGenres() }),
  head: () => ({ links: [{ rel: "canonical", href: siteUrl }] }),
  component: RouteComponent,
});

function next<T>(values: readonly T[], current: T) {
  return values[(values.indexOf(current) + 1) % values.length];
}

function RouteComponent() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const term = () => search().q ?? "";
  const filter = () => search().type ?? filters[0];
  const sort = () => search().sort ?? sorts[0];

  // default values are left out of the url
  const setSearch = (
    patch: Partial<{ q: string; type: GenreFilter; sort: GenreSort }>,
  ) =>
    navigate({
      to: ".",
      search: (prev) => {
        const merged = { ...prev, ...patch };
        return {
          q: merged.q || undefined,
          type: merged.type === filters[0] ? undefined : merged.type,
          sort: merged.sort === sorts[0] ? undefined : merged.sort,
        };
      },
      replace: true,
    });

  const genres = createMemo(() =>
    sortGenres(filterGenres(data().genres, filter(), term()), sort()),
  );

  return (
    <Layout
      header={{
        title: "all genres",
        children: (
          <div class="flex gap-6">
            <div class="flex grow gap-3">
              <button
                class="btn"
                onClick={() => setSearch({ type: next(filters, filter()) })}
              >
                {filter()}
              </button>

              <input
                value={term()}
                onInput={(e) => setSearch({ q: e.currentTarget.value })}
                class="h-9 min-w-0 grow bg-zinc-50-950 px-3"
                name="q"
                placeholder={placeholders[filter()]}
              />

              <button
                class="btn"
                onClick={() => setSearch({ sort: next(sorts, sort()) })}
              >
                {sort()}
              </button>
            </div>
          </div>
        ),
      }}
    >
      <VirtualGrid entries={genres()}>
        {(genre) => (
          <Chip
            to="/genre/$slug"
            params={{ slug: genreSlug(genre.name) }}
            trailing={
              <PlayButton
                title={genre.previewTitle}
                class="bt size-9 shrink-0 justify-center"
                style={{ "background-color": genre.color }}
                track={{ title: genre.previewTitle, url: genre.previewUrl }}
              />
            }
          >
            {genre.name}
          </Chip>
        )}
      </VirtualGrid>
    </Layout>
  );
}
