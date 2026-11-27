import { LoadFirstTrack } from "#components/play";
import { parseItunesId, encodeItunesId, isSingleRelease } from "#lib/api/platforms/itunes-data";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import * as everynoise from "#lib/api/platforms/everynoise.server";
import * as itunes from "#lib/api/platforms/itunes.server";
import * as wikipedia from "#lib/api/platforms/wikipedia.server";
import { extractArtworkColors } from "#lib/artwork-color.server";
import { siteUrl } from "#lib/constants";
import {
  artistSitemapCount,
  artistSitemapPath,
  sitemapUrlLimit,
  sitemapIndexResponse,
  urlsetResponse,
} from "#lib/sitemap.server";
import { isGenreSlug, similarGenresSlug } from "#pages/genre/GenrePage";
import { fantanoReview, layerServer, wikipediaSummary, type RequestInfo } from "#server/api";
import { storeCountry } from "#services/Api";
import type { WikipediaSubject } from "#domain/music";
import { Preferences, SavePlayOnHover } from "#services/Preferences";
import { Router } from "@effect/ui";
import { HtmlServer } from "@effect/ui/html";
import { SKULLET_CSS } from "skullet/internal";
import { skulletCSS } from "skullet";
import { isbot } from "isbot";
import { Effect, Layer, Option, Stream } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { App } from "../App.ts";
import { AppRoute, type AppRoute as Route, musicUrl, genreUrl } from "../routes.ts";

// ---------------------------------------------------------------------------
// the json api the browser's `Api` calls
// ---------------------------------------------------------------------------

const searchParam = (name: string) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    return new URL(request.url, siteUrl).searchParams.get(name) ?? "";
  });

const json = (load: () => Promise<unknown>) =>
  Effect.tryPromise(load).pipe(
    Effect.map((value) => HttpServerResponse.jsonUnsafe(value ?? null)),
    Effect.orElseSucceed(() => HttpServerResponse.text("Upstream failed", { status: 502 })),
  );

const slugParam = Effect.map(HttpRouter.params, (params) => params.slug ?? "");

const ApiRoutes = Layer.mergeAll(
  HttpRouter.add(
    "GET",
    "/api/genres",
    json(() => everynoise.getAllGenres()),
  ),
  HttpRouter.add(
    "GET",
    "/api/genres/:slug",
    Effect.flatMap(slugParam, (slug) => json(() => everynoise.getGenreBySlug(slug))),
  ),
  HttpRouter.add(
    "GET",
    "/api/similar-genres/:slug",
    Effect.flatMap(slugParam, (slug) => json(() => everynoise.findSimilarGenres(slug))),
  ),
  HttpRouter.add(
    "GET",
    "/api/everynoise-artist",
    Effect.flatMap(searchParam("name"), (name) => json(() => everynoise.getArtistByName(name))),
  ),
  HttpRouter.add(
    "GET",
    "/api/wikipedia",
    Effect.gen(function* () {
      const kind = yield* searchParam("kind");
      const name = yield* searchParam("name");
      const artist = yield* searchParam("artist");
      const subject =
        kind === "album"
          ? { kind, name, artist }
          : kind === "artist" || kind === "genre"
            ? { kind, name }
            : undefined;
      if (!subject) return HttpServerResponse.text("Unknown kind", { status: 400 });
      return HttpServerResponse.jsonUnsafe(yield* wikipediaSummary(subject as WikipediaSubject));
    }),
  ),
  HttpRouter.add(
    "GET",
    "/api/wikipedia-genres",
    Effect.flatMap(searchParam("title"), (title) => json(() => wikipedia.getGenres(title))),
  ),
  HttpRouter.add(
    "GET",
    "/api/artwork-colors",
    Effect.flatMap(searchParam("url"), (url) => json(() => extractArtworkColors(url))),
  ),
  HttpRouter.add(
    "GET",
    "/api/fantano",
    Effect.gen(function* () {
      const artist = yield* searchParam("artist");
      const album = yield* searchParam("album");
      return HttpServerResponse.jsonUnsafe(fantanoReview(artist, album));
    }),
  ),
);

// ---------------------------------------------------------------------------
// robots and sitemaps
// ---------------------------------------------------------------------------

const fromResponse = (response: Promise<Response>) =>
  Effect.promise(() => response).pipe(Effect.map(HttpServerResponse.fromWeb));

const SeoRoutes = Layer.mergeAll(
  HttpRouter.add(
    "GET",
    "/robots.txt",
    HttpServerResponse.text(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, {
      contentType: "text/plain; charset=utf-8",
    }),
  ),
  HttpRouter.add(
    "GET",
    "/sitemap.xml",
    Effect.suspend(() =>
      fromResponse(
        (async () => {
          // still serve the pages sitemap if the mappings fail to load
          const artistIds = await everynoise.getMappedArtistIds().catch(() => []);
          const artistPages = Array.from({ length: artistSitemapCount(artistIds.length) }, (_, i) =>
            artistSitemapPath(i + 1),
          );
          return sitemapIndexResponse(["/sitemaps/pages.xml", ...artistPages]);
        })(),
      ),
    ),
  ),
  HttpRouter.add(
    "GET",
    "/sitemaps/pages.xml",
    Effect.suspend(() =>
      fromResponse(
        everynoise.getAllGenres().then((genres) => {
          const slugs = new Set(genres.map((genre) => genreNameToSlug(genre.genreName)));
          return urlsetResponse(["/", ...Array.from(slugs, (slug) => `/genre/${slug}`)]);
        }),
      ),
    ),
  ),
  HttpRouter.add(
    "GET",
    "/sitemaps/:file",
    Effect.flatMap(HttpRouter.params, ({ file = "" }) =>
      fromResponse(
        (async () => {
          const page = file.match(/^artists-([1-9]\d*)\.xml$/)?.[1];
          const artistIds = await everynoise.getMappedArtistIds();
          const number = page ? Number(page) : 0;
          if (number < 1 || number > artistSitemapCount(artistIds.length)) {
            return new Response("Not found", { status: 404 });
          }
          const chunk = artistIds.slice((number - 1) * sitemapUrlLimit, number * sitemapUrlLimit);
          return urlsetResponse(chunk.map((id) => `/${encodeItunesId(id)}`));
        })(),
      ),
    ),
  ),
);

// ---------------------------------------------------------------------------
// pages
// ---------------------------------------------------------------------------

// skullet's stylesheet and its theme, as its react provider rendered them
const skulletStyles = `<style>${SKULLET_CSS}</style><style>${skulletCSS({ mode: "system" })}</style>`;

// the redirects and 404s a page's data decides. people load itunes pages in their own
// browser, which redirects there, so only crawlers get these for itunes pages
async function outcome(
  route: Route,
  info: RequestInfo,
): Promise<{ status: number; location?: string }> {
  const country = storeCountry(info.languages);

  switch (route._tag) {
    case "NotFound":
      return { status: 404 };

    case "Genre": {
      const { slug } = route.params;
      if (!isGenreSlug(slug)) return { status: 404 };
      const genre = await everynoise.getGenreBySlug(slug).catch(() => null);
      if (genre) return { status: 200 };
      // wikipedia often says "folk music" where everynoise just has "folk"
      if (slug.endsWith("music")) return { status: 307, location: genreUrl(slug.slice(0, -5)) };
      // warms the suggestions the 404 page shows
      await everynoise.findSimilarGenres(similarGenresSlug(slug)).catch(() => []);
      return { status: 404 };
    }

    case "Music": {
      const id = parseItunesId(route.params.itunesId);
      if (id === undefined) return { status: 404 };
      if (!info.isBot) return { status: 200 };
      const music = await itunes.getMusic(id, country).catch(() => undefined);
      if (!music) return { status: 404 };
      // a single is just its one track
      if (
        music.type === "album" &&
        isSingleRelease(music.album.collectionName, music.tracks.length)
      ) {
        const [track] = music.tracks;
        if (track) return { status: 307, location: musicUrl(encodeItunesId(track.trackId)) };
      }
      return { status: 200 };
    }

    case "Search": {
      const q = route.search.q?.trim();
      if (!info.isBot || !q || !route.search.lucky) return { status: 200 };
      const [topArtist] = await itunes.searchArtists(q, country).catch(() => []);
      return topArtist
        ? { status: 307, location: musicUrl(encodeItunesId(topArtist.artistId)) }
        : { status: 200 };
    }

    case "Index":
      return { status: 200 };
  }
}

// nothing stored and nothing to save on the server
const ServerPreferences = Layer.succeed(Preferences, {
  playOnHover: Stream.empty,
  setPlayOnHover: () => Effect.void,
});

export const pagesRoute = (document: (rendered: HtmlServer.Rendered<unknown>) => string) =>
  HttpRouter.add("GET", "*", (request) =>
    Effect.gen(function* () {
      const url = new URL(request.url, siteUrl);

      const resolved = AppRoute.resolve(url.pathname + url.search);
      if (Option.isNone(resolved)) return HttpServerResponse.text("Not found", { status: 404 });
      const { invalid, redirected, route } = resolved.value;
      if (redirected || invalid.length > 0) {
        return HttpServerResponse.redirect(AppRoute.print(route), {
          status: invalid.length > 0 ? 302 : 301,
        });
      }

      const info: RequestInfo = {
        isBot: isbot(request.headers["user-agent"]),
        languages: request.headers["accept-language"],
      };

      const { status, location } = yield* Effect.promise(() => outcome(route, info));
      if (location) return HttpServerResponse.redirect(location, { status });

      // only what the server can render waits: the genre list and itunes for people load in
      // the browser, so their pages render their loading state at once
      const serverRendered = route._tag === "Genre" || route._tag === "NotFound" || info.isBot;

      const rendered = yield* HtmlServer.renderToHtml(App, Router.props(AppRoute), {
        budget: serverRendered && route._tag !== "Index" ? "500 millis" : "0 millis",
      }).pipe(
        Effect.provide(Router.static({ routes: AppRoute, url: url.pathname + url.search })),
        Effect.provide(
          Layer.mergeAll(LoadFirstTrack.layer, SavePlayOnHover.layer).pipe(
            Layer.provideMerge(Layer.mergeAll(layerServer(info), ServerPreferences)),
          ),
        ),
      );

      const html = document(rendered).replace("</head>", `${skulletStyles}</head>`);

      return HttpServerResponse.text(html, {
        status,
        contentType: "text/html; charset=utf-8",
      });
    }),
  );

export const AppRoutes = (document: (rendered: HtmlServer.Rendered<unknown>) => string) =>
  Layer.mergeAll(ApiRoutes, SeoRoutes, pagesRoute(document));
