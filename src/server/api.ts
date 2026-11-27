import { ApiError } from "#domain/schema";
import type { FantanoReview, WikipediaSubject } from "#domain/music";
import * as everynoise from "#lib/api/platforms/everynoise.server";
import * as itunes from "#lib/api/platforms/itunes.server";
import * as wikipedia from "#lib/api/platforms/wikipedia.server";
import { extractArtworkColors } from "#lib/artwork-color.server";
import { Api, errorMessage, storeCountry } from "#services/Api";
import fantanoReviews from "../data/fantano-reviews.json" with { type: "json" };
import { Effect, Layer } from "effect";

const attempt = <A>(load: () => Promise<A>) =>
  Effect.tryPromise({
    try: load,
    catch: (error) => new ApiError({ message: errorMessage(error) }),
  });

const quietly = <A>(load: () => Promise<A>) => attempt(load).pipe(Effect.orElseSucceed(() => null));

export const wikipediaSummary = (subject: WikipediaSubject) =>
  quietly(() => wikipedia.getSummary(subject));

export function fantanoReview(artist: string, album: string): FantanoReview | null {
  const review = fantanoReviews.find((review) => review.title === `${artist} - ${album}`);
  return review ? { excerpt: review.excerpt ?? null, url: review.url } : null;
}

export interface RequestInfo {
  // crawlers get server rendered (and cached) itunes pages, people fetch from itunes in their own browser
  readonly isBot: boolean;
  readonly languages: string | undefined;
}

// the server's implementation, per request
export const layerServer = ({ isBot, languages }: RequestInfo) =>
  Layer.succeed(Api, {
    // 2.4mb, so the browser loads it
    allGenres: Effect.never,
    genreBySlug: (slug) => attempt(async () => (await everynoise.getGenreBySlug(slug)) ?? null),
    similarGenres: (slug) => attempt(() => everynoise.findSimilarGenres(slug)),
    everynoiseArtist: (name) =>
      quietly(async () => (await everynoise.getArtistByName(name)) ?? null),
    wikipediaSummary,
    wikipediaGenres: (title) =>
      attempt(() => wikipedia.getGenres(title)).pipe(Effect.orElseSucceed(() => [])),
    artworkColors: (url) => quietly(() => extractArtworkColors(url)),
    fantanoReview: (artist, album) => Effect.sync(() => fantanoReview(artist, album)),
    ...(isBot ? itunesApi(storeCountry(languages)) : notOnTheServer),
  });

const itunesApi = (country: ReturnType<typeof storeCountry>) => ({
  music: (id: number) => attempt(async () => (await itunes.getMusic(id, country)) ?? null),
  artistName: (id: number) =>
    quietly(async () => (await itunes.getArtistName(id, country)) ?? null),
  searchArtists: (name: string) => attempt(() => itunes.searchArtists(name, country)),
  searchMusic: (term: string) => attempt(() => itunes.searchMusic(term, country)),
});

// never settles, so the page renders its loading state and the browser fetches
const notOnTheServer = {
  music: () => Effect.never,
  artistName: () => Effect.never,
  searchArtists: () => Effect.never,
  searchMusic: () => Effect.never,
};
