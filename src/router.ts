import { routeTree } from "./routeTree.gen";
import { createRouter } from "@tanstack/react-router";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
    // These panels scroll independently of the browser window.
    scrollToTopSelectors: ["page", "sidebar", "content", "genre-grid"].map(
      (id) => `[data-scroll-restoration-id="${id}"]`,
    ),
  });
}
