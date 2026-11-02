import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { VirtualGrid } from "#components/virtual-grid";
import { useEnumToggle } from "#hooks/use-enum-toggle";
import { useQueryState } from "#hooks/use-query-state";
import { $everynoise } from "#lib/api/index";
import { siteUrl } from "#lib/constants";
import { genreNameToSlug, sortHexColorsToGradient } from "#lib/utils";
import { createFileRoute } from "@tanstack/solid-router";
import { createMemo, Show } from "solid-js";

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
    defaultValue: type() ?? "genre",
  });

  const [sort, setSort] = useQueryState("sort", {
    defaultValue: "popularity",
  });

  const sortType = useEnumToggle(["popularity", "alphabetical", "color"], {
    onUpdate: setSort,
    defaultValue: sort() ?? "popularity",
  });

  return (
    <Layout
      header={{
        title: "all genres",
        children: (
          <div class="flex gap-6">
            <div class="flex grow gap-3">
              <button class="btn" onClick={filterType.cycle}>
                {filterType.current()}
              </button>

              <input
                value={searchTerm() ?? ""}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
                class="h-9 min-w-0 grow bg-zinc-50-950 px-3"
                name="q"
                enterkeyhint="search"
                autocapitalize="none"
                autocorrect="off"
                placeholder={
                  {
                    genre: "filter genre names",
                    preview: "filter genre preview track name",
                  }[filterType.current()]
                }
              />

              <Show when={filterType.current() === "lookup"}>
                <button type="submit" class="btn-inverse size-9 justify-center">
                  →
                </button>
              </Show>

              <button class="btn" onClick={sortType.cycle}>
                {sortType.current()}
              </button>
            </div>
          </div>
        ),
      }}
    >
      <Genres
        filterType={filterType.current()}
        sortType={sortType.current()}
        searchTerm={searchTerm()}
        genres={data().genres}
      />
    </Layout>
  );
}

function Genres(props: {
  genres: Everynoise.Genre[];
  searchTerm: string;
  filterType: string;
  sortType: string;
}) {
  const filteredGenres = () => {
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
  };

  const sortedGenres = createMemo(() => {
    const filtered = filteredGenres();

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
  });

  return (
    <VirtualGrid entries={sortedGenres()}>
      {(genre) => (
        <Chip
          to="/genre/$slug"
          params={{ slug: genreNameToSlug(genre.genreName) }}
          trailing={
            <PlayButton
              title={genre.previewTitle}
              class="bt size-9 shrink-0 justify-center"
              style={{ "background-color": genre.color }}
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
