import { LoadFirstTrack } from "#components/play";
import { Api } from "#services/Api";
import { Preferences, SavePlayOnHover } from "#services/Preferences";
import { Router } from "@effect/ui";
import { BrowserRouter, HtmlHydrate } from "@effect/ui/html";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { App } from "./App.ts";
import { AppRoute } from "./routes.ts";

// a stale chunk after a deploy: load the page again
addEventListener("vite:preloadError", () => location.reload());

const Platform = Layer.mergeAll(LoadFirstTrack.layer, SavePlayOnHover.layer).pipe(
  Layer.provideMerge(Layer.mergeAll(Api.layerHttp, Preferences.layerLocalStorage)),
  Layer.provideMerge(
    Layer.mergeAll(BrowserRouter.layer({ routes: AppRoute }), FetchHttpClient.layer),
  ),
);

const container = document.getElementById("app")!;
const state = JSON.parse(document.getElementById("state")?.textContent ?? "{}");

const main = Effect.gen(function* () {
  const root = yield* HtmlHydrate.hydrateEffect(App, Router.props(AppRoute), container, state);
  yield* root.adopted;
  return yield* Effect.never;
}).pipe(Effect.scoped, Effect.provide(Platform));

Effect.runFork(main);
