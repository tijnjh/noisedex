/// <reference types="vite/client" />
import { ErrorAlert } from "#components/error-alert";
import { MiniPlayer } from "#components/mini-player";
import { Spinner } from "#components/spinner";
import { siteName } from "#lib/constants";
import { getErrorMessage } from "#lib/utils";
import styleCss from "../style.css?url";
import { HydrationScript } from "@solidjs/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
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
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#e4e4e7",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#27272a",
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const isNavigating = useRouterState({
    select: (s) => s.status === "pending",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" class="pointer-coarse:overscroll-none">
        <head>
          <HydrationScript />
          <HeadContent />
        </head>

        <body class="relative isolate touch-manipulation bg-zinc-200-800 text-black scheme-light-dark dark:text-white">
          <div class="app-shell grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[1fr_min-content] md:grid-cols-[auto_1fr]">
            <Aside />

            <CatchBoundary
              getResetKey={() => "reset"}
              errorComponent={({ error }) => (
                <ErrorAlert message={getErrorMessage(error)} />
              )}
            >
              <Show when={isNavigating()} fallback={<Outlet />}>
                <div class="pointer-events-none grid size-full place-items-center">
                  <Spinner />
                </div>
              </Show>
            </CatchBoundary>
          </div>

          <MiniPlayer />

          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  );
}

function Aside() {
  return (
    <aside class="app-navigation z-999 flex h-full flex-col gap-3 border-zinc-300-700 p-3 max-md:order-1 max-md:border-t md:w-60 md:border-r">
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
