/// <reference types="vite/client" />
import { ErrorAlert } from "#components/error-alert";
import { MiniPlayer } from "#components/mini-player";
import { siteName } from "#lib/constants";
import { getErrorMessage } from "#lib/utils";
import styleCss from "../style.css?url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CatchBoundary,
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Provider } from "jotai";
import { useState } from "react";

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <html lang="en" className="pointer-coarse:overscroll-none">
          <head>
            <HeadContent />
          </head>

          <body className="relative isolate touch-manipulation bg-zinc-200-800 text-black scheme-light-dark dark:text-white">
            <div className="app-shell relative grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[minmax(0,1fr)_auto_auto] md:grid-cols-[auto_1fr]">
              <Aside />

              <CatchBoundary
                getResetKey={() => "reset"}
                errorComponent={({ error }) => (
                  <ErrorAlert message={getErrorMessage(error)} />
                )}
              >
                <Outlet />
              </CatchBoundary>

              <MiniPlayer />
            </div>

            <Scripts />
          </body>
        </html>
      </QueryClientProvider>
    </Provider>
  );
}

function Aside() {
  return (
    <aside className="app-navigation z-999 flex h-full flex-col gap-3 border-zinc-300-700 p-3 max-md:order-2 max-md:border-t md:w-60 md:border-r">
      <span className="h-9 text-2xl font-bold max-md:hidden">{siteName}</span>

      <div className="flex gap-3 md:contents">
        {tabs.map(([name, to]) => (
          <Link
            key={to}
            activeProps={{ className: "btn-inverse" }}
            inactiveProps={{ className: "btn" }}
            to={to}
          >
            {name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
