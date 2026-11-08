import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { VirtualGrid } from "#components/virtual-grid";
import { useGenreFilters } from "#hooks/use-genre-filters";
import { $everynoise } from "#lib/api/index";
import {
  genreNameToSlug,
  type Genre,
} from "#lib/api/platforms/everynoise-data";
import { siteUrl } from "#lib/constants";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const genres = await $everynoise.getAllGenres();
    return { genres };
  },
  head: () => ({ links: [{ rel: "canonical", href: siteUrl }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();

  const filters = useGenreFilters();

  return (
    <Layout
      header={{
        title: "all genres",
        children: (
          <div className="flex min-w-0 gap-6">
            <div className="flex min-w-0 grow gap-3">
              <button className="btn shrink-0" onClick={filters.cycleFilter}>
                {filters.filter.value}
              </button>

              <input
                value={filters.query}
                onChange={(e) => filters.setQuery(e.currentTarget.value)}
                aria-label="Filter genres"
                className="h-9 min-w-0 grow bg-zinc-50-950 px-3"
                name="q"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={filters.filter.placeholder}
              />

              <button className="btn shrink-0" onClick={filters.cycleSort}>
                {filters.sort.value}
              </button>
            </div>
          </div>
        ),
      }}
    >
      <Genres filters={filters} genres={data.genres} />
    </Layout>
  );
}

function Genres(props: {
  genres: Genre[];
  filters: ReturnType<typeof useGenreFilters>;
}) {
  const { query, filter, sort, setQuery } = props.filters;
  const sortedGenres = useMemo(() => {
    const term = query.toLowerCase();
    const filtered = term
      ? props.genres.filter((genre) =>
          filter.text(genre).toLowerCase().includes(term),
        )
      : props.genres;
    return sort.apply(filtered);
  }, [props.genres, query, filter, sort]);

  if (!sortedGenres.length) {
    return (
      <div className="flex flex-col items-start gap-3 p-3">
        <p role="status">No genres found.</p>
        {query && (
          <button type="button" className="btn" onClick={() => setQuery("")}>
            Clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <VirtualGrid entries={sortedGenres} getKey={(genre) => genre.genreName}>
      {(genre) => (
        <Chip
          to="/genre/$slug"
          params={{ slug: genreNameToSlug(genre.genreName) }}
          trailing={
            <PlayButton
              title={genre.previewTitle}
              className="btn size-9 shrink-0 justify-center"
              style={{ backgroundColor: genre.color }}
              track={{ title: genre.previewTitle, url: genre.previewUrl }}
            />
          }
        >
          {genre.genreName}
        </Chip>
      )}
    </VirtualGrid>
  );
}
