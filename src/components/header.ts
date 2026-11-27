import { LogoGlyph } from "#components/basics";
import { anchorName, PlayOnHover, PlayOnHoverMessage, Popovers } from "#components/providers";
import { nextSortOf, sortOf } from "#lib/genre-sorts";
import { Command, Router, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Switch } from "@effect/ui-kit";
import { Schema } from "effect";
import { AppRoute, indexUrl } from "../routes.ts";

export const HeaderProps = Schema.Struct({
  route: AppRoute,
  title: Schema.optional(Schema.String),
  titleClassName: Schema.optional(Schema.String),
  titleVt: Schema.optional(Schema.String),
  // the big title scrolled away: the logo collapses and the title moves in here
  collapsed: Schema.Boolean,
});

export const HeaderMessage = UiSchema.TaggedEnum({
  EnteredLogo: {},
  LeftLogo: {},
  ToggledPlayOnHover: { checked: Schema.Boolean },
  TypedSearch: { value: Schema.String },
  SubmittedSearch: {},
  ClickedSort: {},
  OpenedSortPopover: {},
  ClosedSortPopover: {},
});

const searchOf = (route: AppRoute) =>
  route._tag === "Index" || route._tag === "Search" ? (route.search.q ?? "") : "";

export const Header = Html.component({
  name: "Header",
  props: HeaderProps,
  model: Schema.Struct({
    hovering: Schema.Boolean,
    // what's typed when the search bar isn't the homepage's genre filter
    searchTerm: Schema.String,
    sortPopover: Schema.Boolean,
  }),
  message: HeaderMessage,
  reads: {
    playOnHover: PlayOnHover,
    popovers: {
      owner: Popovers,
      report: (model, { route }, id) => {
        if (!model.sortPopover || route._tag !== "Index") return null;
        return {
          anchor: anchorName(id("sort")),
          touch: false,
          content: {
            _tag: "SortHint" as const,
            current: sortOf(route.search.sort).value,
            next: nextSortOf(route.search.sort).value,
          },
        };
      },
    },
  },
  restore: false,
}).make({
  init: ($) => ({ hovering: false, searchTerm: searchOf($.props.route), sortPopover: false }),
  update: ($, message) => {
    const { route } = $.props;
    // on the homepage the search bar doubles as the genre filter
    const value = route._tag === "Index" ? (route.search.q ?? "") : $.model.searchTerm;

    return HeaderMessage.match(message, {
      EnteredLogo: () => $.evolve({ hovering: true }),
      LeftLogo: () => $.evolve({ hovering: false }),
      ToggledPlayOnHover: ({ checked }) =>
        $.send(PlayOnHover, PlayOnHoverMessage.ToggledPlayOnHover({ checked })),
      TypedSearch: ({ value }) =>
        route._tag === "Index"
          ? $.run(
              Router.patchSearch(AppRoute, route, { q: value || undefined }).pipe(Command.asNoop),
            )
          : $.evolve({ searchTerm: value }),
      SubmittedSearch: () => {
        const q = value.trim();
        if (!q) return $.model;
        return $.run(
          Router.push(AppRoute, AppRoute.Search({ search: { q } })).pipe(Command.asNoop),
        );
      },
      ClickedSort: () => {
        if (route._tag !== "Index") return $.model;
        const next = nextSortOf(route.search.sort).value;
        return $.run(
          Router.patchSearch(AppRoute, route, {
            sort: next === "popularity" ? undefined : next,
          }).pipe(Command.asNoop),
        );
      },
      OpenedSortPopover: () => $.evolve({ sortPopover: true }),
      ClosedSortPopover: () => $.evolve({ sortPopover: false }),
    });
  },
  view: (h, model) => {
    const { route, title, titleClassName, titleVt, collapsed } = h.props;
    const isHomepage = route._tag === "Index";
    const value = isHomepage ? (route.search.q ?? "") : model.searchTerm;
    const expanded = !collapsed || model.hovering;

    const collapsibleLetters = (show: boolean, vt: string, part: "oise" | "ex") =>
      h.span
        .attr("data-collapsible-letters", "")
        .attr("data-shown", show ? "" : undefined)
        .style({ viewTransitionName: show ? vt : undefined })
        .children(LogoGlyph(h, part));

    const logo = h.a
      .attr("href", indexUrl)
      .class("text-2xl hover:opacity-75")
      .children(
        h.div
          .class("group flex *:overflow-hidden")
          .on("mouseenter", HeaderMessage.EnteredLogo())
          .on("mouseleave", HeaderMessage.LeftLogo())
          .children(
            h.span.style({ viewTransitionName: "header-title-n" }).children(LogoGlyph(h, "n")),
            collapsibleLetters(expanded, "header-title-oise", "oise"),
            h.span.style({ viewTransitionName: "header-title-d" }).children(LogoGlyph(h, "d")),
            collapsibleLetters(expanded, "header-title-ex", "ex"),
          ),
        h.span.class("sr-only").children("noisedex"),
      );

    const pageTitle =
      title &&
      h.div
        .attr("data-page-title", "")
        .attr("data-shown", collapsed ? "" : undefined)
        .class("flex items-center gap-3")
        .children(
          "•",
          h.h1
            .style({ viewTransitionName: titleVt })
            .class("truncate text-2xl", titleClassName)
            .children(title),
        );

    const sortButton =
      route._tag === "Index" &&
      h.button
        .attrs({
          type: "button",
          "aria-label": `Sorted by ${sortOf(route.search.sort).value}; sort by ${nextSortOf(route.search.sort).value}`,
        })
        .style({ anchorName: anchorName(h.id("sort")) })
        .on("mouseenter", HeaderMessage.OpenedSortPopover())
        .on("mouseleave", HeaderMessage.ClosedSortPopover())
        .on("focus", HeaderMessage.OpenedSortPopover())
        .on("blur", HeaderMessage.ClosedSortPopover())
        .on("click", HeaderMessage.ClickedSort())
        .class("btn size-9 shrink-0 justify-center px-0 text-sm")
        .children(sortOf(route.search.sort).label);

    const searchBar = h.form
      .style({ viewTransitionName: "search" })
      .class("flex grow gap-3")
      .on("submit", HeaderMessage.SubmittedSearch())
      .children(
        sortButton,
        h.input
          .value(value)
          .on("input", ({ value }) => HeaderMessage.TypedSearch({ value }))
          .attrs({
            required: "",
            "aria-label": isHomepage
              ? "Filter genres; press Enter to search artists, albums, and tracks"
              : "Search artists, albums, and tracks",
            name: "q",
            enterkeyhint: "search",
            autocapitalize: "none",
            autocorrect: "off",
            placeholder: isHomepage
              ? "filter genres, enter to search"
              : "look up an artist, album, or track",
          })
          .class("h-9 min-w-0 grow px-3 surface"),
        h.button
          .attrs({ type: "submit", "aria-label": "Search" })
          .class("btn-inverse size-9 justify-center")
          .children("⌕"),
      );

    return h.header
      .class(
        "flex gap-3 overflow-hidden p-3 max-md:order-last max-md:flex-col md:items-center md:justify-between",
      )
      .children(
        h.div.class("flex items-center gap-3 truncate").children(logo, pageTitle),
        h.div.class("flex grow items-center gap-3 md:max-w-xl").children(
          h.label
            .class(
              "flex cursor-pointer items-center gap-3 select-none max-md:hidden pointer-coarse:hidden",
            )
            .children(
              "play on hover",
              Switch(h, {
                props: { checked: h.reads.playOnHover.enabled },
                onToggle: ({ checked }) => HeaderMessage.ToggledPlayOnHover({ checked }),
                view: (parts) =>
                  parts
                    .root(
                      h.button.class(
                        "flex h-5 w-9 shrink-0 border border-neutral-950 bg-white p-0.5 transition-colors duration-150 ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 data-checked:bg-neutral-950 dark:border-white dark:bg-neutral-950 dark:focus-visible:outline-white dark:data-checked:bg-white",
                      ),
                    )
                    .children(
                      parts.thumb(
                        h.span.class(
                          "size-3.5 bg-neutral-950 transition-[translate,background-color] duration-150 ease-[ease] data-checked:translate-x-4 data-checked:bg-white dark:bg-white dark:data-checked:bg-neutral-950",
                        ),
                      ),
                    ),
              }),
            ),
          searchBar,
        ),
      );
  },
});
