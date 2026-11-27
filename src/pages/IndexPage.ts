import { GenreChip } from "#components/chips";
import { Layout } from "#components/layout";
import { ErrorPage, LoadingPage } from "#components/status";
import type { Genre } from "#lib/api/platforms/everynoise-data";
import { canonical } from "#lib/head";
import { sortOf, type GenreSort } from "#lib/genre-sorts";
import { AllGenres, RetryPage } from "#queries/queries";
import { Command, Router, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { VirtualList } from "@effect/ui-kit";
import { Schema } from "effect";
import { AppRoute } from "../routes.ts";

const IndexRoute = AppRoute.subset(["Index"]);

export const IndexPageMessage = UiSchema.TaggedEnum({
  ClickedClearFilter: {},
  ClickedRetry: {},
});

// filtering and sorting thousands of genres is the slow part, so it only runs again when one changes
let filtered: { genres: Genre[]; q: string; sort: GenreSort; result: Genre[] } | undefined;

function filterGenres(genres: Genre[], q: string, sort: GenreSort) {
  if (filtered?.genres === genres && filtered.q === q && filtered.sort === sort) {
    return filtered.result;
  }
  const term = q.toLowerCase();
  const matching = term
    ? genres.filter((genre) => genre.genreName.toLowerCase().includes(term))
    : genres;
  filtered = { genres, q, sort, result: sortOf(sort).apply(matching) };
  return filtered.result;
}

export const IndexPage = Html.component({
  name: "IndexPage",
  props: Schema.Struct({ route: IndexRoute }),
  model: Schema.Struct({}),
  message: IndexPageMessage,
  // the full genre list is 2.4mb, so the server never loads it (see `#server/render`)
  queries: { genres: { query: AllGenres, args: () => ({}) } },
}).make({
  init: () => ({}),
  update: ($, message) =>
    IndexPageMessage.match(message, {
      ClickedClearFilter: () =>
        $.run(Router.patchSearch(AppRoute, $.props.route, { q: undefined }).pipe(Command.asNoop)),
      ClickedRetry: () => $.run(RetryPage.make({})),
    }),
  head: () => [canonical("/")],
  view: (h) => {
    const { route } = h.props;
    const result = h.queries.genres;

    if (result._tag === "Initial") return LoadingPage(h, route, "Loading genres");
    if (result._tag === "Failure") {
      return ErrorPage(h, {
        route,
        error: "the genres failed to load",
        onRetry: IndexPageMessage.ClickedRetry(),
      });
    }

    const query = route.search.q ?? "";
    const genres = filterGenres(result.value, query, route.search.sort);

    const content = genres.length
      ? VirtualList(h, {
          key: "genres",
          props: {
            keys: genres.map((genre) => genre.genreName),
            itemSize: 36,
            overscan: 8,
            initialCount: 60,
            // a different filter starts back at the top
            scrollTo: { target: { _tag: "Offset", offset: 0 }, id: genres.length },
          },
          view: (virtualList) =>
            virtualList.viewport(h.div.class("h-full overflow-x-hidden overflow-y-auto")).children(
              h.div.class("relative px-3 pb-32 max-md:pt-3").children(
                virtualList
                  .list(h.ul.class("relative grid grid-cols-responsive gap-grid-gap"))
                  .children(
                    virtualList.items.map((index) => {
                      const genre = genres[index]!;
                      return virtualList
                        .item({ element: h.li.key(genre.genreName), index })
                        .children(GenreChip(h, genre));
                    }),
                  ),
              ),
            ),
        })
      : h.div
          .class("flex flex-col items-start gap-3 p-3")
          .children(
            h.p
              .attr("role", "status")
              .children(
                "no genres found.",
                query.trim() && " press enter to search artists, albums and tracks.",
              ),
            query &&
              h.button
                .attr("type", "button")
                .class("btn")
                .on("click", IndexPageMessage.ClickedClearFilter())
                .children("clear filter"),
          );

    return Layout(h, { key: "layout", props: { route }, slots: { content: [content] } });
  },
});
