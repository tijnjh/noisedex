export interface Genre {
  genreName: string;
  color: string;
  previewUrl: string;
  previewTitle: string;
}

export const everynoiseUrl = "https://everynoise.com";

export function genreNameToSlug(genre: string | undefined | null) {
  if (!genre) return;
  return genre.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

export function findSoundOfPlaylistId(
  links: Array<{ text: string; href: string }>,
) {
  const fullUrl = links.find((l) => l.text === "playlist")?.href;
  if (!fullUrl) return;
  return fullUrl.replace("https://open.spotify.com/playlist/", "");
}

export function trimLinkPostfix(str: string) {
  return str.trim().endsWith("»") ? str.trim().replace("»", "") : str;
}

export function splitPreviewTitle(previewTitle: string | undefined | null) {
  if (previewTitle == null) return;

  if (previewTitle.startsWith("e.g.")) {
    previewTitle = previewTitle.replace("e.g.", "");
  }

  const match = previewTitle.trim().match(/^(.+?)\s+"([\s\S]*)"$/);
  if (!match) return;

  const [, artist, title] = match;
  return { artist: artist.trimEnd(), title };
}
