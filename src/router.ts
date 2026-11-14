import { ErrorPage, NotFoundPage } from "#components/status-page";
import { scrollRegionSelectors } from "#lib/scroll-regions";
import { routeTree } from "./routeTree.gen";
import { createRouter } from "@tanstack/react-router";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
    defaultPreload: "intent",
    defaultStaleTime: 60_000,
    defaultViewTransition: true,
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
    scrollToTopSelectors: scrollRegionSelectors,
  });
}
