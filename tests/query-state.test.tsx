import { useEnumToggle } from "../src/hooks/use-enum-toggle";
import { useQueryState } from "../src/hooks/use-query-state";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(cleanup);

function Filters() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [type, setType] = useQueryState("type", { defaultValue: "genre" });
  const [sort, setSort] = useQueryState("sort", { defaultValue: "popularity" });
  const filter = useEnumToggle(["genre", "preview"], {
    defaultValue: type,
    onUpdate: setType,
  });
  const sorting = useEnumToggle(["popularity", "alphabetical", "color"], {
    defaultValue: sort,
    onUpdate: setSort,
  });

  return (
    <>
      <input
        aria-label="Filter genres"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <button aria-label="Filter type" onClick={filter.cycle}>
        {filter.current}
      </button>
      <button aria-label="Sort genres" onClick={sorting.cycle}>
        {sorting.current}
      </button>
    </>
  );
}

async function renderFilters(initialEntries: string[]) {
  const history = createMemoryHistory({ initialEntries });
  const router = createRouter({
    history,
    routeTree: createRootRoute({ component: Filters }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("textbox", { name: "Filter genres" });
  return { history, router };
}

describe("URL-backed genre controls", () => {
  it("preserves other search parameters and replaces the history entry when editing filters", async () => {
    const { history, router } = await renderFilters([
      "/?q=rock&type=preview&sort=color&source=shared",
    ]);
    const input = screen.getByRole("textbox", {
      name: "Filter genres",
    }) as HTMLInputElement;
    expect(input.value).toBe("rock");
    expect(
      screen.getByRole("button", { name: "Filter type" }).textContent,
    ).toBe("preview");
    expect(
      screen.getByRole("button", { name: "Sort genres" }).textContent,
    ).toBe("color");

    fireEvent.change(input, { target: { value: "jazz" } });
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        q: "jazz",
        type: "preview",
        sort: "color",
        source: "shared",
      }),
    );
    expect(history.length).toBe(1);

    fireEvent.change(input, { target: { value: "" } });
    await waitFor(() =>
      expect(router.state.location.search).not.toHaveProperty("q"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Filter type" }));
    await waitFor(() =>
      expect(router.state.location.search).not.toHaveProperty("type"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort genres" }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ source: "shared" }),
    );
    expect(history.length).toBe(1);
  });

  it("updates the input and both toggles on back and forward navigation", async () => {
    const { history } = await renderFilters([
      "/?q=first",
      "/?q=second&type=preview&sort=alphabetical",
    ]);
    const input = screen.getByRole("textbox", {
      name: "Filter genres",
    }) as HTMLInputElement;
    expect(input.value).toBe("second");

    act(() => history.back());
    await waitFor(() => {
      expect(input.value).toBe("first");
      expect(
        screen.getByRole("button", { name: "Filter type" }).textContent,
      ).toBe("genre");
      expect(
        screen.getByRole("button", { name: "Sort genres" }).textContent,
      ).toBe("popularity");
    });

    act(() => history.forward());
    await waitFor(() => {
      expect(input.value).toBe("second");
      expect(
        screen.getByRole("button", { name: "Filter type" }).textContent,
      ).toBe("preview");
      expect(
        screen.getByRole("button", { name: "Sort genres" }).textContent,
      ).toBe("alphabetical");
    });
  });
});
