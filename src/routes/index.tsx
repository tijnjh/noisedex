import { GenreChip } from "#components/genre-chip";
import { Layout } from "#components/layout";
import { LoadingPage } from "#components/status-page";
import { VirtualGrid } from "#components/virtual-grid";
import { useGenreFilters } from "#hooks/use-genre-filters";
import * as $everynoise from "#lib/api/platforms/everynoise";
import { siteUrl } from "#lib/constants";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  // the full genre list is 2.4mb, so we load it on the browser hehe
  ssr: false,
  loader: () => $everynoise.getAllGenres(),
  head: () => ({ links: [{ rel: "canonical", href: siteUrl }] }),
  component: RouteComponent,
  pendingComponent: () => <LoadingPage label="Loading genres" />,
});

function RouteComponent() {
  const genres = Route.useLoaderData();
  const { query, sort, setQuery } = useGenreFilters();

  const sortedGenres = useMemo(() => {
    const term = query.toLowerCase();
    const filtered = term
      ? genres.filter((genre) => genre.genreName.toLowerCase().includes(term))
      : genres;
    return sort.apply(filtered);
  }, [genres, query, sort]);

  return (
    <Layout>
      {sortedGenres.length ? (
        <VirtualGrid entries={sortedGenres} getKey={(genre) => genre.genreName}>
          {(genre) => <GenreChip genre={genre} />}
        </VirtualGrid>
      ) : (
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
      )}
    </Layout>
  );
}
