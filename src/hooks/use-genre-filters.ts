import type { Genre } from "#lib/api/platforms/everynoise-data";
import { sortHexColorsToGradient } from "#lib/color-sort";
import { useLocation, useNavigate } from "@tanstack/react-router";

const sorts = [
  {
    value: "popularity",
    label: "top",
    apply: (genres: Genre[]) => genres,
  },
  {
    value: "alphabetical",
    label: "a-z",
    apply: (genres: Genre[]) => [...genres].sort((a, b) => a.genreName.localeCompare(b.genreName)),
  },
  {
    value: "color",
    label: "clr",
    apply: (genres: Genre[]) => sortHexColorsToGradient(genres, (genre) => genre.style.color),
  },
] as const;

export function useGenreFilters() {
  const search = useLocation({
    select: (location) => location.search,
  }) as Record<string, unknown>;
  const navigate = useNavigate();
  const query = typeof search.q === "string" ? search.q : "";
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

  const nextSort = sorts[(sorts.indexOf(sort) + 1) % sorts.length];

  return {
    query,
    sort,
    setQuery: (value: string) => update("q", value, ""),
    nextSort,
    cycleSort: () => update("sort", nextSort.value, sorts[0].value),
  };
}
