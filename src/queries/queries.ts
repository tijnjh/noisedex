import type { ArtistResult, ArtworkColors, FantanoReview, Music, MusicSearch } from "#domain/music";
import { ApiError, Json } from "#domain/schema";
import type { ArtistMeta, Genre, GenreMeta } from "#lib/api/platforms/everynoise-data";
import type { WikipediaSummary } from "#lib/api/platforms/wikipedia";
import { resolveCredit, type CreditedArtist } from "#lib/artist-credit";
import { Api } from "#services/Api";
import { Command, Query } from "@effect/ui";
import { Effect, Layer, Schema } from "effect";

const withApi = <A>(f: (api: Api["Service"]) => A) =>
  Effect.gen(function* () {
    return f(yield* Api);
  });

// a page's own data, which its "try again" refetches
export const PageData = Query.Tag("PageData");

export class RetryPage extends Command.Service<RetryPage>()("pages/RetryPage", {
  invalidates: () => [PageData],
}) {
  static readonly layer = this.toLayer(() => Effect.void);
}

// as long as a loaded page used to stay fresh
const staleTime = "60 seconds";

export class AllGenres extends Query.Service<AllGenres>()("everynoise/AllGenres", {
  success: Json<Genre[]>(),
  error: ApiError,
  tags: [PageData],
  staleTime: "Infinity",
}) {
  static readonly layer = this.toLayer(withApi((api) => () => api.allGenres));
}

export class GenreBySlug extends Query.Service<GenreBySlug>()("everynoise/GenreBySlug", {
  args: { slug: Schema.String },
  success: Json<GenreMeta | null>(),
  error: ApiError,
  tags: [PageData],
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ slug }) =>
          api.genreBySlug(slug),
    ),
  );
}

export class SimilarGenres extends Query.Service<SimilarGenres>()("everynoise/SimilarGenres", {
  args: { slug: Schema.String },
  success: Json<Genre[]>(),
  error: ApiError,
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ slug }) =>
          api.similarGenres(slug),
    ),
  );
}

export class EverynoiseArtist extends Query.Service<EverynoiseArtist>()(
  "everynoise/EverynoiseArtist",
  { args: { name: Schema.String }, success: Json<ArtistMeta | null>(), staleTime },
) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ name }) =>
          api.everynoiseArtist(name),
    ),
  );
}

export class WikipediaArticle extends Query.Service<WikipediaArticle>()(
  "wikipedia/WikipediaArticle",
  {
    args: {
      kind: Schema.Literals(["artist", "genre", "album"]),
      name: Schema.String,
      artist: Schema.optional(Schema.String),
    },
    success: Json<WikipediaSummary | null>(),
    staleTime,
  },
) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ kind, name, artist }) =>
          api.wikipediaSummary(
            kind === "album" ? { kind, name, artist: artist ?? "" } : { kind, name },
          ),
    ),
  );
}

export class WikipediaGenres extends Query.Service<WikipediaGenres>()("wikipedia/WikipediaGenres", {
  args: { title: Schema.String },
  success: Schema.Array(Schema.String),
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ title }) =>
          api.wikipediaGenres(title),
    ),
  );
}

export class ArtworkColorsQuery extends Query.Service<ArtworkColorsQuery>()(
  "itunes/ArtworkColors",
  {
    args: { url: Schema.String },
    success: Json<ArtworkColors | null>(),
    staleTime,
  },
) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ url }) =>
          api.artworkColors(url),
    ),
  );
}

export class Fantano extends Query.Service<Fantano>()("fantano/Review", {
  args: { artist: Schema.String, album: Schema.String },
  success: Json<FantanoReview | null>(),
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ artist, album }) =>
          api.fantanoReview(artist, album),
    ),
  );
}

export class GetMusic extends Query.Service<GetMusic>()("itunes/GetMusic", {
  args: { id: Schema.Number },
  success: Json<Music | null>(),
  error: ApiError,
  tags: [PageData],
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ id }) =>
          api.music(id),
    ),
  );
}

// itunes only ids the first artist of a credit like "A, B & C", so its name shows where it ends
export class ArtistCredit extends Query.Service<ArtistCredit>()("itunes/ArtistCredit", {
  args: { credit: Schema.String, artistId: Schema.Number },
  success: Json<CreditedArtist[]>(),
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ credit, artistId }) =>
          resolveCredit(credit, artistId, (id) => api.artistName(id)),
    ),
  );
}

export class SearchArtists extends Query.Service<SearchArtists>()("itunes/SearchArtists", {
  args: { q: Schema.String },
  success: Json<ArtistResult[]>(),
  error: ApiError,
  tags: [PageData],
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ q }) =>
          api.searchArtists(q),
    ),
  );
}

export class SearchMusic extends Query.Service<SearchMusic>()("itunes/SearchMusic", {
  args: { q: Schema.String },
  success: Json<MusicSearch>(),
  error: ApiError,
  tags: [PageData],
  staleTime,
}) {
  static readonly layer = this.toLayer(
    withApi(
      (api) =>
        ({ q }) =>
          api.searchMusic(q),
    ),
  );
}

// every query, for the pages to provide
export const QueriesLive = Layer.mergeAll(
  AllGenres.layer,
  GenreBySlug.layer,
  SimilarGenres.layer,
  EverynoiseArtist.layer,
  WikipediaArticle.layer,
  WikipediaGenres.layer,
  ArtworkColorsQuery.layer,
  Fantano.layer,
  GetMusic.layer,
  ArtistCredit.layer,
  SearchArtists.layer,
  SearchMusic.layer,
  RetryPage.layer,
);
