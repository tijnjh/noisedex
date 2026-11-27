import { PopoverLayer } from "#components/play";
import {
  Accent,
  BodyBackground,
  NowPlaying,
  PlayOnHover,
  Popovers,
  ThemeColor,
} from "#components/providers";
import { NotFoundPage } from "#components/status";
import { siteName } from "#lib/constants";
import { QueriesLive } from "#queries/queries";
import { GenrePage } from "#pages/genre/GenrePage";
import { IndexPage } from "#pages/IndexPage";
import { MusicPage } from "#pages/MusicPage";
import { SearchPage } from "#pages/SearchPage";
import { Component, Head, Router, UiSchema } from "@effect/ui";
import { Html, HtmlHead } from "@effect/ui/html";
import { Schema } from "effect";
import { AppRoute } from "./routes.ts";

export const AppMessage = UiSchema.TaggedEnum({
  ChangedRoute: { route: AppRoute },
});

export const AppNoDeps = Html.component({
  name: "App",
  props: Schema.Struct({ route: AppRoute }),
  model: Schema.Struct({
    route: AppRoute,
    // counts the page changes, so playback stops on each one
    navigation: Schema.Number,
  }),
  message: AppMessage,
}).make({
  init: ($) => ({ route: $.props.route, navigation: 0 }),
  update: ($, { route }) =>
    AppRoute.printPath(route) === AppRoute.printPath($.model.route)
      ? $.evolve({ route })
      : $.evolve({ route, navigation: (n) => n + 1 }).viewTransition(),
  subscriptions: ({ model }) => [
    Router.subscription(AppRoute, model.route, (route) => AppMessage.ChangedRoute({ route })),
    // a page's data loads while its link is hovered, so it renders at once when the link is
    // followed, and the view transition morphs into it. the genre list is 2.4mb, so it waits
    Router.prefetch(AppRoute, {
      Index: () => [],
      Search: (route) => [Router.page(SearchPage, { route })],
      Genre: (route) => [Router.page(GenrePage, { route })],
      Music: (route) => [Router.page(MusicPage, { route })],
      NotFound: () => [],
    }),
  ],
  head: () => [
    HtmlHead.lang("en"),
    Head.title(`${siteName} • Explore music genres and albums`),
    HtmlHead.meta({
      name: "description",
      content: `Explore music genres, discover artists, and browse their albums and tracks on ${siteName}.`,
    }),
    HtmlHead.meta({ property: "og:site_name", content: siteName }),
  ],
  view: (h, { route, navigation }) => {
    // each path mounts a fresh page; a search change updates the page in place
    const key = AppRoute.printPath(route);

    const page = () =>
      AppRoute.match(route, {
        Index: (route) => IndexPage(h, { key, props: { route } }),
        Search: (route) => SearchPage(h, { key, props: { route } }),
        Genre: (route) => GenrePage(h, { key, props: { route } }),
        Music: (route) => MusicPage(h, { key, props: { route } }),
        NotFound: () => NotFoundPage(h, route),
      });

    return NowPlaying(h, {
      props: { navigation },
      view: (nowPlaying) =>
        PlayOnHover(h, {
          view: () =>
            Popovers(h, {
              view: (popovers) =>
                Accent(h, {
                  view: (accent) =>
                    h.div
                      .attr("data-app-shell", "")
                      .class(
                        "relative grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[minmax(0,1fr)_auto]",
                      )
                      .onMount(BodyBackground({ background: accent.background }))
                      .children(
                        h.div
                          .attrs({ "data-top-gradient": "", "aria-hidden": "true" })
                          .style({ "--theme-color": accent.color, "--theme-middle": accent.middle })
                          .onMount(ThemeColor({ color: accent.color })),
                        accent.color &&
                          h.div
                            .key(accent.color)
                            .attr("aria-hidden", "true")
                            .class(
                              "pointer-events-none fixed inset-x-0 -top-1.75 z-100000000 hidden h-3 max-md:pointer-coarse:block",
                            )
                            .style({ backgroundColor: accent.color }),

                        page(),

                        nowPlaying.track?.url &&
                          nowPlaying.audio(
                            h.audio.attrs({ src: nowPlaying.track.url, autoplay: "" }),
                          ),

                        PopoverLayer(h, popovers.open),
                      ),
                }),
            }),
        }),
    });
  },
});

// every page's queries are provided here, where `Router.prefetch` can reach them
export const App = AppNoDeps.pipe(Component.provide(QueriesLive));
