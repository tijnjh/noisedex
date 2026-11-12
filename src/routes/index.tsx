import { GenreChip } from "#components/genre-chip";
import { Layout } from "#components/layout";
import { VirtualGrid } from "#components/virtual-grid";
import { useGenreFilters } from "#hooks/use-genre-filters";
import { $everynoise } from "#lib/api/index";
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
    <Layout header={{ collapsed: false }}>
      <Genres filters={filters} genres={data.genres} />
    </Layout>
  );
}

function Genres(props: {
  genres: $everynoise.Genre[];
  filters: ReturnType<typeof useGenreFilters>;
}) {
  const { query, filter, sort, setQuery } = props.filters;
  const sortedGenres = useMemo(() => {
    const term = query.toLowerCase();
    const filtered = term
      ? props.genres.filter((genre) => filter.text(genre).toLowerCase().includes(term))
      : props.genres;
    return sort.apply(filtered);
  }, [props.genres, query, filter, sort]);

  if (!sortedGenres.length) {
    return (
      <div className="flex flex-col items-start gap-3 p-3">
        <p role="status">
          no genres found.
          {query.trim() && " press enter to search artists, albums and tracks."}
        </p>
        {query && (
          <button type="button" className="btn" onClick={() => setQuery("")}>
            clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <VirtualGrid entries={sortedGenres} getKey={(genre) => genre.genreName}>
      {(genre) => <GenreChip genre={genre} />}
    </VirtualGrid>
  );
}
