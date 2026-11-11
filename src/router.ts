import { scrollRegionSelectors } from "#lib/scroll-regions";
import { routeTree } from "./routeTree.gen";
import { createRouter } from "@tanstack/react-router";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultStaleTime: 60_000,
    defaultViewTransition: true,
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
    scrollToTopSelectors: scrollRegionSelectors,
  });
}
