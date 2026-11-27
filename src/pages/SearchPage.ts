import { Section } from "#components/basics";
import { MusicChip, SearchArtistChip } from "#components/chips";
import { scrollRegion, Layout } from "#components/layout";
import { ErrorPage, LoadingPage } from "#components/status";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { siteName } from "#lib/constants";
import { RetryPage, SearchArtists, SearchMusic } from "#queries/queries";
import { Command, Head, Router, UiSchema, type View } from "@effect/ui";
import { Html, HtmlHead } from "@effect/ui/html";
import { Schema } from "effect";
import { AppRoute } from "../routes.ts";

const SearchRoute = AppRoute.subset(["Search"]);

export const SearchPageMessage = UiSchema.TaggedEnum({
  LoadedArtists: {},
  ClickedRetry: {},
});

const queryOf = (route: typeof SearchRoute.Type) => route.search.q?.trim() || undefined;

const Results = <M, C extends View.Children<M>>(
  h: Html.H<M>,
  options: { title: string; label: string; count: number; children: C },
) =>
  options.count
    ? [
        Section(h, {
          title: options.title,
          label: options.label,
          children: [h.div.class("cool-grid").children(options.children)],
        }),
      ]
    : [];

export const SearchPage = Html.component({
  name: "SearchPage",
  props: Schema.Struct({ route: SearchRoute }),
  model: Schema.Struct({}),
  message: SearchPageMessage,
  queries: {
    artists: {
      query: SearchArtists,
      args: ({ props }) => {
        const q = queryOf(props.route);
        return q === undefined ? undefined : { q };
      },
      onChange: () => SearchPageMessage.LoadedArtists(),
    },
    music: {
      query: SearchMusic,
      // feeling lucky goes straight to the top artist, so it only searches when there's none
      args: ({ props, queries }) => {
        const q = queryOf(props.route);
        if (q === undefined) return undefined;
        if (props.route.search.lucky && queries.artists._tag !== "Failure") {
          if (queries.artists._tag !== "Success" || queries.artists.value.length) return undefined;
        }
        return { q };
      },
    },
  },
}).make({
  init: () => ({}),
  update: ($, message) =>
    SearchPageMessage.match(message, {
      LoadedArtists: () => {
        const artists = $.queries.artists;
        const [topArtist] = artists._tag === "Success" ? artists.value : [];
        if (!$.props.route.search.lucky || !topArtist) return $.model;

        return $.run(
          Router.replace(
            AppRoute,
            AppRoute.Music({ params: { itunesId: encodeItunesId(topArtist.artistId) } }),
          ).pipe(Command.asNoop),
        );
      },
      ClickedRetry: () => $.run(RetryPage.make({})),
    }),
  head: () => [
    Head.title(`Search artists, albums, and tracks • ${siteName}`),
    HtmlHead.meta({ name: "robots", content: "noindex,follow" }),
  ],
  view: (h) => {
    const { route } = h.props;

    // no query
    if (queryOf(route) === undefined) {
      return Layout(h, { key: "layout", props: { route, title: "search", split: true } });
    }

    const { artists, music } = h.queries;
    const failure = [artists, music].find((result) => result._tag === "Failure");
    if (failure?._tag === "Failure") {
      return ErrorPage(h, {
        route,
        error: "the search failed",
        onRetry: SearchPageMessage.ClickedRetry(),
      });
    }
    if (artists._tag !== "Success" || music._tag !== "Success") {
      return LoadingPage(h, route, "Loading results");
    }

    const foundArtists = artists.value;
    const { albums, tracks } = music.value;

    return Layout(h, {
      key: "layout",
      props: { route },
      slots: {
        content: [
          h.div
            .onMount(scrollRegion("content"))
            .class("flex h-full flex-col gap-3 overflow-y-auto p-3")
            .children(
              Results(h, {
                title: "artists",
                label: "Artists",
                count: foundArtists.length,
                children: foundArtists.map((artist) => SearchArtistChip(h, artist)),
              }),
              Results(h, {
                title: "albums",
                label: "Albums",
                count: albums.length,
                children: albums.map((album) => MusicChip(h, album, true)),
              }),
              Results(h, {
                title: "tracks",
                label: "Tracks",
                count: tracks.length,
                children: tracks.map((track) => MusicChip(h, track, true)),
              }),
              !foundArtists.length &&
                !albums.length &&
                !tracks.length &&
                h.p.attr("role", "status").children("nothing found for that search"),
            ),
        ],
      },
    });
  },
});
