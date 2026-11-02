import { Scrappy } from "./scrappy";
import CSV from "papaparse";

export const everynoiseUrl = "https://everynoise.com";

export interface Genre {
  name: string;
  color: string;
  previewTitle?: string;
  previewUrl?: string;
}

export interface GenreArtist {
  name: string;
  spotifyId: string;
  color: string;
  previewTitle?: string;
  previewUrl?: string;
}

export interface GenrePage {
  name: string;
  /** id of the spotify "the sound of <genre>" playlist */
  playlistId?: string;
  artists: GenreArtist[];
  related: Genre[];
}

export type GenreFilter = "genre" | "preview";
export type GenreSort = "popularity" | "alphabetical" | "color";

// i tested this against all 6000 genres
export function genreSlug(name: string) {
  return name.replace(/[^a-z0-9]/gi, "");
}

/** parses the pregenerated `genres.gen.csv` catalog, in popularity order */
export function parseGenreCatalog(csv: string): Genre[] {
  return CSV.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  }).data.map((row) => ({
    name: row.genreName,
    color: row.color,
    previewTitle: row.previewTitle || undefined,
    previewUrl: row.previewUrl || undefined,
  }));
}

export function genreSlugs(catalog: Genre[]) {
  return [...new Set(catalog.map((genre) => genreSlug(genre.name)))].filter(
    Boolean,
  );
}

/** parses an everynoise `engenremap-<slug>.html` page; null when it isn't one */
export async function parseGenrePage(html: string): Promise<GenrePage | null> {
  const page = await Scrappy.init({ raw: html });

  const title = page.find(".title");
  if (!title) return null;

  // the title reads "<a>Every Noise at Once</a> · <genre name> ..."
  const name = title.el.childNodes[1]?.textContent
    ?.replace(/^[\s·]+/, "")
    .trim();
  if (!name) return null;

  const playlistId = title
    .findAll<HTMLAnchorElement>("a")
    .find((a) => a.textContent === "playlist")
    ?.getAttribute("href")
    ?.replace("https://open.spotify.com/playlist/", "");

  const artists = (page.find(".canvas")?.findAll(".genre") ?? []).flatMap(
    (el): GenreArtist[] => {
      // e.g. "artistprofile.html?id=1QAJqy2dA3ihHBFIHRphZj"
      const href = el.querySelector("a")?.getAttribute("href") ?? "";
      const spotifyId = new URLSearchParams(href.split("?")[1]).get("id");
      if (!spotifyId) return [];
      return [{ name: entryName(el), spotifyId, ...entryStyle(el) }];
    },
  );

  const related = (
    page.find("#tunnel")?.find(".canvas")?.findAll(".genre") ?? []
  )
    .map((el): Genre => ({ name: entryName(el), ...entryStyle(el) }))
    .filter((genre) => genre.name !== name);

  return { name, playlistId, artists, related };
}

function entryName(el: HTMLElement) {
  return el.childNodes[0]?.textContent?.trim() ?? "";
}

function entryStyle(el: HTMLElement) {
  return {
    color: el.style.getPropertyValue("color"),
    previewTitle: el.getAttribute("title") ?? undefined,
    previewUrl: el.getAttribute("preview_url") ?? undefined,
  };
}

export type FetchText = (url: string) => Promise<string | null>;

export const fetchText: FetchText = async (url) => {
  const response = await fetch(url);
  return response.ok ? response.text() : null;
};

/** The genre pages seam: live everynoise in prod, saved html in tests. */
export function createGenrePages(fetch: FetchText = fetchText) {
  return {
    async getBySlug(slug: string): Promise<GenrePage | null> {
      const cleanSlug = genreSlug(slug);
      if (!cleanSlug) return null;

      const html = await fetch(`${everynoiseUrl}/engenremap-${cleanSlug}.html`);
      return html ? parseGenrePage(html) : null;
    },

    async getArtistGenres(spotifyId: string): Promise<string[]> {
      const json = await fetch(
        `${everynoiseUrl}/api/${encodeURIComponent(spotifyId)}`,
      );
      if (!json) return [];
      // shaped like { "<artist name>": ["genre", ...] }
      const [genres] = Object.values(JSON.parse(json) as object);
      return Array.isArray(genres) ? genres : [];
    },
  };
}

export function filterGenres(
  genres: Genre[],
  by: GenreFilter,
  term: string,
): Genre[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return genres;

  return genres.filter((genre) =>
    (by === "genre" ? genre.name : (genre.previewTitle ?? ""))
      .toLowerCase()
      .includes(needle),
  );
}

export function sortGenres(genres: Genre[], sort: GenreSort): Genre[] {
  switch (sort) {
    case "popularity":
      return genres;
    case "alphabetical":
      return [...genres].sort((a, b) => a.name.localeCompare(b.name));
    case "color":
      return sortHexColorsToGradient(genres, (genre) => genre.color);
  }
}

function colorCoordinates(hex: string) {
  let value = hex.replace(/^#/, "");

  if (value.length === 3)
    value = [...value].map((digit) => digit + digit).join("");

  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = channels;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI - 15 + 360) % 360;

  return { hue, lightness, chroma };
}

export function sortHexColorsToGradient<T>(
  items: T[],
  getColor: (item: T) => string,
): T[] {
  return items
    .map((item) => ({ item, ...colorCoordinates(getColor(item)) }))
    .sort((a, b) => {
      const hueA = Math.floor(a.hue / 15);
      const hueB = Math.floor(b.hue / 15);
      if (hueA !== hueB) return hueA - hueB;

      const direction = hueA % 2 === 0 ? 1 : -1;
      const lightnessA = Math.floor(a.lightness / 0.05);
      const lightnessB = Math.floor(b.lightness / 0.05);
      return (
        direction * (lightnessA - lightnessB) ||
        direction * (lightnessA % 2 === 0 ? 1 : -1) * (a.chroma - b.chroma) ||
        direction * (a.lightness - b.lightness) ||
        a.hue - b.hue
      );
    })
    .map(({ item }) => item);
}
