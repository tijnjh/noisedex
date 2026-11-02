/// <reference types="vite/client" />
import { ErrorAlert } from "#components/error-alert";
import { MiniPlayer } from "#components/mini-player";
import { Spinner } from "#components/spinner";
import { siteName } from "#lib/constants";
import { getErrorMessage } from "#lib/utils";
import styleCss from "../style.css?url";
import { HydrationScript } from "@solidjs/web";
import {
  CatchBoundary,
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/solid-router";
import { cn } from "cn";
import { createEffect, createSignal, For, Show } from "solid-js";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: `${siteName} | Explore music genres and albums` },
      {
        name: "description",
        content: `Explore music genres, discover artists, and browse their albums and tracks on ${siteName}.`,
      },
      { property: "og:site_name", content: siteName },
    ],
    links: [{ href: styleCss, rel: "stylesheet" }],
  }),

  component: RootComponent,
});

const tabs = [
  ["genres", "/"],
  ["search", "/search"],
] as const;

function RootComponent() {
  const isNavigating = useRouterState({
    select: (s) => s.status === "pending",
  });

  const [showNavigationSpinner, setShowNavigationSpinner] = createSignal(false);

  createEffect(
    () => isNavigating(),
    (isNavigating) => {
      if (!isNavigating) {
        setShowNavigationSpinner(false);
        return;
      }

      const timeout = setTimeout(() => {
        setShowNavigationSpinner(true);
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    },
  );

  return (
    <html lang="en" class="pointer-coarse:overscroll-none">
      <head>
        <HydrationScript />
        <HeadContent />
      </head>

      <body class="relative isolate touch-manipulation bg-zinc-200-800 text-black scheme-light-dark select-none dark:text-white">
        <div class="grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[1fr_min-content] md:grid-cols-[auto_1fr]">
          <div
            aria-hidden="true"
            class="pointer-events-none fixed top-0 left-0 z-99999999 h-80 w-full select-none"
          >
            <div
              class={cn(
                "absolute top-0 h-80 w-full rounded-[100%] bg-black/25 blur-3xl transition-all duration-500",
                showNavigationSpinner()
                  ? "-translate-y-1/2 opacity-100"
                  : "-translate-y-full opacity-0",
              )}
            />
            <div
              class={cn(
                "absolute top-6 left-1/2 -translate-x-1/2 transition-all duration-300",
                showNavigationSpinner()
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-6 opacity-0",
              )}
            >
              <Show when={isNavigating() && showNavigationSpinner()}>
                <Spinner />
              </Show>
            </div>
          </div>

          <Aside />

          <CatchBoundary
            getResetKey={() => "reset"}
            errorComponent={({ error }) => (
              <ErrorAlert message={getErrorMessage(error)} />
            )}
          >
            <Outlet />
          </CatchBoundary>
        </div>

        <MiniPlayer />

        <Scripts />
      </body>
    </html>
  );
}

function Aside() {
  return (
    <aside class="z-999 flex h-full flex-col gap-3 border-zinc-300-700 p-3 max-md:order-1 max-md:border-t md:w-60 md:border-r">
      <span class="h-9 text-2xl font-bold max-md:hidden">{siteName}</span>

      <div class="flex gap-3 md:contents">
        <For each={tabs}>
          {([name, to]) => (
            <Link
              activeProps={{ class: "btn-inverse" }}
              inactiveProps={{ class: "btn" }}
              to={to}
            >
              {name}
            </Link>
          )}
        </For>
      </div>
    </aside>
  );
}
