import { PlatformLinks } from "#components/basics";
import { EverynoiseArtistChip, GenreChip } from "#components/chips";
import { ContentPane, Layout } from "#components/layout";
import { ErrorPage, LoadingPage, StatusPage } from "#components/status";
import { WikipediaDescription } from "#components/wikipedia";
import { siteName } from "#lib/constants";
import { pageHead } from "#lib/head";
import { genreLinks } from "#lib/platform-links";
import { previewPlayback } from "#lib/playback";
import { capitalizeWords } from "#lib/utils";
import { GenreBySlug, RetryPage, SimilarGenres, WikipediaArticle } from "#queries/queries";
import { Command, Router, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { AppRoute } from "../../routes.ts";

const GenreRoute = AppRoute.subset(["Genre"]);

export const isGenreSlug = (slug: string) => /^[a-z0-9]+$/.test(slug);

// for a genre that isn't there
export const similarGenresSlug = (slug: string) => slug.toLowerCase().replace(/[^a-z0-9]/g, "");

export const GenrePageMessage = UiSchema.TaggedEnum({
  LoadedGenre: {},
  ClickedRetry: {},
});

export const GenrePage = Html.component({
  name: "GenrePage",
  props: Schema.Struct({ route: GenreRoute }),
  model: Schema.Struct({}),
  message: GenrePageMessage,
  queries: {
    genre: {
      query: GenreBySlug,
      args: ({ props: { route } }) =>
        isGenreSlug(route.params.slug) ? { slug: route.params.slug } : undefined,
      onChange: () => GenrePageMessage.LoadedGenre(),
    },
    similar: {
      query: SimilarGenres,
      args: ({ props: { route }, queries }) => {
        const missing = !isGenreSlug(route.params.slug)
          ? !route.params.slug.endsWith("music")
          : queries.genre._tag === "Success" &&
            queries.genre.value === null &&
            !route.params.slug.endsWith("music");
        return missing ? { slug: similarGenresSlug(route.params.slug) } : undefined;
      },
    },
    wikipedia: {
      query: WikipediaArticle,
      args: ({ queries }) =>
        queries.genre._tag === "Success" && queries.genre.value
          ? { kind: "genre" as const, name: queries.genre.value.genreName }
          : undefined,
    },
  },
}).make({
  init: () => ({}),
  update: ($, message) =>
    GenrePageMessage.match(message, {
      // wikipedia often says "folk music" where everynoise just has "folk"
      LoadedGenre: () => {
        const { slug } = $.props.route.params;
        const { genre } = $.queries;
        if (genre._tag !== "Success" || genre.value || !slug.endsWith("music")) return $.model;

        return $.run(
          Router.replace(AppRoute, AppRoute.Genre({ params: { slug: slug.slice(0, -5) } })).pipe(
            Command.asNoop,
          ),
        );
      },
      ClickedRetry: () => $.run(RetryPage.make({})),
    }),
  head: ({ props: { route }, queries }) => {
    const name = queries.genre._tag === "Success" ? queries.genre.value?.genreName : undefined;
    return pageHead({
      title: `${capitalizeWords(name ?? "Genre")} artists`,
      description: `Explore ${name ?? "this genre"} artists and related music genres on ${siteName}.`,
      path: `/genre/${route.params.slug}`,
    });
  },
  view: (h) => {
    const { route } = h.props;
    const { genre, similar, wikipedia } = h.queries;
    const validSlug = isGenreSlug(route.params.slug);

    if (genre._tag === "Failure") {
      return ErrorPage(h, {
        route,
        error: genre.cause.toString(),
        onRetry: GenrePageMessage.ClickedRetry(),
      });
    }

    if (!validSlug || (genre._tag === "Success" && genre.value === null)) {
      if (similar._tag !== "Success" && similar._tag !== "Failure") {
        return LoadingPage(h, route, "Loading genre");
      }
      const suggestions = similar._tag === "Success" ? similar.value : [];

      return StatusPage(h, {
        route,
        code: "404",
        title: "genre not found",
        extra:
          suggestions.length === 0
            ? undefined
            : [
                h.section.class("flex w-full flex-col gap-3").children(
                  h.h2.class("section-divider").children("did you mean one of these?"),
                  suggestions.map((genre) => GenreChip(h, genre)),
                ),
              ],
        children: [h.p.children("there's no genre at this address. try searching for it instead.")],
      });
    }

    if (genre._tag === "Initial" || genre.value === null) {
      return LoadingPage(h, route, "Loading genre");
    }

    const data = genre.value;

    return Layout(h, {
      key: "layout",
      props: {
        route,
        title: data.genreName,
        titleClassName: "capitalize",
        accent: { color: data.style?.color },
        split: true,
        playback: data.preview
          ? {
              _tag: "Ready",
              playback: { track: previewPlayback(data.preview), note: "example track" },
            }
          : undefined,
      },
      slots: {
        leading: [
          PlatformLinks(h, genreLinks(data.links)),
          ...WikipediaDescription(h, { summary: wikipedia }),
          h.span.class("section-divider").children("related genres"),
          h.div
            .class("cool-grid lg:mb-32")
            .children(data.relatedGenres.map((related) => GenreChip(h, related))),
        ],
        trailing: [
          ContentPane(h, {
            label: "Artists in this genre",
            children: [
              h.h2.class("section-divider").children("artists in this genre"),
              h.div
                .class("mb-32 grid grid-cols-responsive gap-3")
                .children(data.artists.map((artist) => EverynoiseArtistChip(h, artist))),
            ],
          }),
        ],
      },
    });
  },
});
