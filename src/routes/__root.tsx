/// <reference types="vite/client" />
import { ErrorAlert } from "#components/error-alert";
import { MiniPlayer } from "#components/mini-player";
import { NavigationSpinner } from "#components/navigation-spinner";
import { siteName } from "#lib/constants";
import { getErrorMessage, vtName } from "#lib/utils";
import styleCss from "../style.css?url";
import {
  CatchBoundary,
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Provider } from "jotai";

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
  return (
    <Provider>
      <html lang="en" className="pointer-coarse:overscroll-none">
        <head>
          <HeadContent />
        </head>

        <body className="relative isolate touch-manipulation bg-zinc-100 text-black scheme-light-dark dark:bg-black dark:text-white">
          <div
            data-app-shell
            className="relative grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[minmax(0,1fr)_auto_auto] md:grid-cols-[auto_1fr]"
          >
            <NavigationSpinner />
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
    </Provider>
  );
}

function Aside() {
  return (
    <aside
      data-app-navigation
      className="z-999 flex h-full flex-col gap-3 p-3 max-md:order-2 md:w-60"
    >
      <span
        {...vtName`${siteName}`}
        className="h-9 text-2xl font-bold max-md:hidden"
      >
        {siteName}
      </span>

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
