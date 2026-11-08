import type { Genre } from "#lib/api/platforms/everynoise-data";
import { sortHexColorsToGradient } from "#lib/utils";
import { useLocation, useNavigate } from "@tanstack/react-router";

const filters = [
  {
    value: "genre",
    placeholder: "filter genre names",
    text: (genre: Genre) => genre.genreName,
  },
  {
    value: "preview",
    placeholder: "filter genre preview track name",
    text: (genre: Genre) => genre.previewTitle,
  },
] as const;

const sorts = [
  { value: "popularity", apply: (genres: Genre[]) => genres },
  {
    value: "alphabetical",
    apply: (genres: Genre[]) =>
      [...genres].sort((a, b) => a.genreName.localeCompare(b.genreName)),
  },
  {
    value: "color",
    apply: (genres: Genre[]) =>
      sortHexColorsToGradient(genres, (genre) => genre.color),
  },
] as const;

export function useGenreFilters() {
  const search = useLocation({
    select: (location) => location.search,
  }) as Record<string, unknown>;
  const navigate = useNavigate();
  const query = typeof search.q === "string" ? search.q : "";
  const filter =
    filters.find((option) => option.value === search.type) ?? filters[0];
  const sort = sorts.find((option) => option.value === search.sort) ?? sorts[0];

  function update(key: string, value: string, defaultValue: string) {
    void navigate({
      to: ".",
      search: (previous) => ({
        ...previous,
        [key]: value === defaultValue ? undefined : value,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  return {
    query,
    filter,
    sort,
    setQuery: (value: string) => update("q", value, ""),
    cycleFilter: () =>
      update(
        "type",
        filters[(filters.indexOf(filter) + 1) % filters.length].value,
        filters[0].value,
      ),
    cycleSort: () =>
      update(
        "sort",
        sorts[(sorts.indexOf(sort) + 1) % sorts.length].value,
        sorts[0].value,
      ),
  };
}
