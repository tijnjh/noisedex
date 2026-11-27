import { ApiError } from "#domain/schema";
import type {
  ArtistResult,
  ArtworkColors,
  FantanoReview,
  Music,
  MusicSearch,
  WikipediaSubject,
} from "#domain/music";
import type { ArtistMeta, Genre, GenreMeta } from "#lib/api/platforms/everynoise-data";
import * as catalog from "#lib/api/platforms/itunes-catalog";
import type { WikipediaSummary } from "#lib/api/platforms/wikipedia";
import { Context, Effect, Layer } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";

// all of the app's data goes through here. the server reads its sources directly
// (`#server/api`), the browser calls the server's json api, and itunes from the browser itself
export class Api extends Context.Service<
  Api,
  {
    readonly allGenres: Effect.Effect<Genre[], ApiError>;
    readonly genreBySlug: (slug: string) => Effect.Effect<GenreMeta | null, ApiError>;
    readonly similarGenres: (slug: string) => Effect.Effect<Genre[], ApiError>;
    // these enrich a page, so they fail quietly to null
    readonly everynoiseArtist: (name: string) => Effect.Effect<ArtistMeta | null>;
    readonly wikipediaSummary: (
      subject: WikipediaSubject,
    ) => Effect.Effect<WikipediaSummary | null>;
    readonly wikipediaGenres: (title: string) => Effect.Effect<string[]>;
    readonly artworkColors: (url: string) => Effect.Effect<ArtworkColors | null>;
    readonly fantanoReview: (artist: string, album: string) => Effect.Effect<FantanoReview | null>;
    readonly music: (id: number) => Effect.Effect<Music | null, ApiError>;
    readonly artistName: (id: number) => Effect.Effect<string | null>;
    readonly searchArtists: (name: string) => Effect.Effect<ArtistResult[], ApiError>;
    readonly searchMusic: (term: string) => Effect.Effect<MusicSearch, ApiError>;
  }
>()("noisedex/Api") {
  // the browser's implementation
  static readonly layerHttp = Layer.effect(
    Api,
    Effect.gen(function* () {
      const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequestInput(HttpClientRequest.prependUrl("/api")),
        HttpClient.filterStatusOk,
      );

      const get = <A>(path: string, urlParams: Record<string, string> = {}) =>
        client.get(path, { urlParams }).pipe(
          Effect.flatMap((response) => response.json),
          Effect.map((json) => json as A),
          Effect.mapError((error) => new ApiError({ message: error.message })),
        );

      const orNull = <A, E>(effect: Effect.Effect<A | null, E>) =>
        effect.pipe(Effect.orElseSucceed(() => null));

      const country = storeCountry(navigator.language);

      const itunes = <A>(load: () => Promise<A>) =>
        Effect.tryPromise({
          try: load,
          catch: (error) => new ApiError({ message: errorMessage(error) }),
        });

      return Api.of({
        allGenres: get("/genres"),
        genreBySlug: (slug) => get(`/genres/${encodeURIComponent(slug)}`),
        similarGenres: (slug) => get(`/similar-genres/${encodeURIComponent(slug)}`),
        everynoiseArtist: (name) => orNull(get("/everynoise-artist", { name })),
        wikipediaSummary: (subject) =>
          orNull(get("/wikipedia", subject.kind === "album" ? subject : { ...subject })),
        wikipediaGenres: (title) =>
          get<string[]>("/wikipedia-genres", { title }).pipe(Effect.orElseSucceed(() => [])),
        artworkColors: (url) => orNull(get("/artwork-colors", { url })),
        fantanoReview: (artist, album) => orNull(get("/fantano", { artist, album })),
        music: (id) => itunes(async () => (await catalog.getMusic(id, country)) ?? null),
        artistName: (id) =>
          itunes(async () => (await catalog.getArtistName(id, country)) ?? null).pipe(
            Effect.orElseSucceed(() => null),
          ),
        searchArtists: (name) => itunes(() => catalog.searchArtists(name, country)),
        searchMusic: (term) => itunes(() => catalog.searchMusic(term, country)),
      });
    }),
  );
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// the store of the most preferred language's region, like "nl" for "nl-NL,en" or "us" for "en"
export function storeCountry(languages = ""): catalog.StoreCountry {
  try {
    const region = new Intl.Locale(languages.split(/[,;]/)[0]!).maximize().region;
    if (region && /^[A-Z]{2}$/.test(region)) return region.toLowerCase() as catalog.StoreCountry;
  } catch {}
  return "us";
}
