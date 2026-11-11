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

function RootComponent() {
  return (
    <Provider>
      <html lang="en" className="antialiased pointer-coarse:overscroll-none">
        <head>
          <HeadContent />
        </head>

        <body className="relative isolate touch-manipulation bg-zinc-100 text-black scheme-light-dark dark:bg-black dark:text-white">
          <div
            data-app-shell
            className="relative grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[auto_auto] md:grid-cols-1"
          >
            <NavigationSpinner />

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
