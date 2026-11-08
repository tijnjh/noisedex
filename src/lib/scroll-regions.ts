export const scrollRegions = {
  page: "page",
  sidebar: "sidebar",
  content: "content",
  genres: "genre-grid",
} as const;

export const scrollRegionSelectors = Object.values(scrollRegions).map(
  (id) => `[data-scroll-restoration-id="${id}"]`,
);
