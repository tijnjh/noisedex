export const scrollRegions = {
  page: "page",
  sidebar: "sidebar",
  content: "content",
  genres: "genre-grid",
} as const;

export type ScrollRegion = keyof typeof scrollRegions;
