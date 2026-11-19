import { AccentHead } from "#components/accent-head";
import { MiniPlayer } from "#components/mini-player";
import { NavigationSpinner } from "#components/navigation-spinner";
import { siteName } from "#lib/constants";
import styleCss from "../style.css?url";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Provider } from "jotai";
import { domAnimation, LazyMotion } from "motion/react";
import { SkulletProvider } from "skullet/react";

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
      { title: `${siteName} • Explore music genres and albums` },
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
          <AccentHead />
        </head>

        <body className="relative isolate touch-manipulation bg-zinc-100 text-black scheme-light-dark dark:bg-black dark:text-white">
          <div
            data-app-shell
            className="relative grid h-dvh grid-cols-1 overflow-hidden max-md:grid-rows-[minmax(0,1fr)_auto]"
          >
            <NavigationSpinner />

            <LazyMotion features={domAnimation} strict>
              <SkulletProvider mode="system">
                <Outlet />
              </SkulletProvider>
            </LazyMotion>

            <MiniPlayer />
          </div>

          <Scripts />
        </body>
      </html>
    </Provider>
  );
}
