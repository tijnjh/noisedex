import { releaseFilters } from "#lib/api/platforms/itunes-data";
import { Route } from "@effect/ui";
import { Effect, Schema } from "effect";

export const genreSorts = ["popularity", "alphabetical", "color"] as const;

export const AppRoute = Route.union({
  // `q` filters the genres, `sort` orders them
  Index: Route.make("/", {
    search: {
      q: Schema.optional(Schema.String),
      sort: Schema.Literals(genreSorts).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed("popularity" as const)),
      ),
    },
  }),

  // `lucky` jumps straight to the top artist
  Search: Route.make("/search", {
    search: {
      q: Schema.optional(Schema.String),
      lucky: Schema.optional(Schema.Boolean),
    },
  }),

  Genre: Route.make("/genre/:slug", { params: { slug: Schema.String } }),

  // artists, albums and tracks share one id space, so they share this route
  Music: Route.make("/:itunesId", {
    params: { itunesId: Schema.String },
    search: {
      // filters the discography on artist pages
      filter: Schema.Literals(releaseFilters).pipe(
        Schema.withDecodingDefaultKey(Effect.succeed("All" as const)),
      ),
    },
  }),

  NotFound: Route.make("/*"),
});

export type AppRoute = typeof AppRoute.Type;

export const indexUrl = AppRoute.print(AppRoute.Index());

export const musicUrl = (itunesId: string) =>
  AppRoute.print(AppRoute.Music({ params: { itunesId } }));

export const genreUrl = (slug: string) => AppRoute.print(AppRoute.Genre({ params: { slug } }));

export const searchUrl = (search: { q?: string; lucky?: boolean }) =>
  AppRoute.print(AppRoute.Search({ search }));
