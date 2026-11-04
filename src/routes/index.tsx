import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { VirtualGrid } from "#components/virtual-grid";
import { useEnumToggle } from "#hooks/use-enum-toggle";
import { useQueryState } from "#hooks/use-query-state";
import { $everynoise } from "#lib/api/index";
import { siteUrl } from "#lib/constants";
import { genreNameToSlug, sortHexColorsToGradient } from "#lib/utils";
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

  const [searchTerm, setSearchTerm] = useQueryState("q", {
    defaultValue: "",
  });

  const [type, setType] = useQueryState("type", {
    defaultValue: "genre",
  });

  const filterType = useEnumToggle(["genre", "preview"], {
    onUpdate: setType,
    defaultValue: type ?? "genre",
  });

  const [sort, setSort] = useQueryState("sort", {
    defaultValue: "popularity",
  });

  const sortType = useEnumToggle(["popularity", "alphabetical", "color"], {
    onUpdate: setSort,
    defaultValue: sort ?? "popularity",
  });

  return (
    <Layout
      header={{
        title: "all genres",
        children: (
          <div className="flex min-w-0 gap-6">
            <div className="flex min-w-0 grow gap-3">
              <button className="btn shrink-0" onClick={filterType.cycle}>
                {filterType.current}
              </button>

              <input
                value={searchTerm ?? ""}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                aria-label="Filter genres"
                className="h-9 min-w-0 grow bg-zinc-50-950 px-3"
                name="q"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={
                  {
                    genre: "filter genre names",
                    preview: "filter genre preview track name",
                  }[filterType.current]
                }
              />

              <button className="btn shrink-0" onClick={sortType.cycle}>
                {sortType.current}
              </button>
            </div>
          </div>
        ),
      }}
    >
      <Genres
        filterType={filterType.current}
        sortType={sortType.current}
        searchTerm={searchTerm}
        genres={data.genres}
        onClearFilter={() => setSearchTerm("")}
      />
    </Layout>
  );
}

function Genres(props: {
  genres: Everynoise.Genre[];
  searchTerm: string;
  filterType: string;
  sortType: string;
  onClearFilter: () => void;
}) {
  const filteredGenres = useMemo(() => {
    const t = props.searchTerm.toLowerCase();

    switch (props.filterType) {
      case "genre":
        return t
          ? props.genres.filter((g) => g.genreName.toLowerCase().includes(t))
          : props.genres;

      case "preview":
        return t
          ? props.genres.filter((g) => g.previewTitle.toLowerCase().includes(t))
          : props.genres;

      default:
        return [];
    }
  }, [props.genres, props.searchTerm, props.filterType]);

  const sortedGenres = useMemo(() => {
    const filtered = filteredGenres;

    switch (props.sortType) {
      case "popularity":
        return filtered;

      case "alphabetical":
        return [...filtered].sort((a, b) =>
          a.genreName.localeCompare(b.genreName),
        );

      case "color":
        return sortHexColorsToGradient(filtered, (item) => item.color);

      default:
        return filtered;
    }
  }, [filteredGenres, props.sortType]);

  if (!sortedGenres.length) {
    return (
      <div className="flex flex-col items-start gap-3 p-3">
        <p role="status">No genres found.</p>
        {props.searchTerm && (
          <button type="button" className="btn" onClick={props.onClearFilter}>
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
