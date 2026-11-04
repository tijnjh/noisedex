import { Scrappy } from "#lib/scrappy";
import { getAllGenres_serverOnly } from "#lib/server-only";
import { genreNameToSlug } from "#lib/utils";
import { createServerFn } from "@tanstack/react-start";
import ky from "ky";
import * as v from "valibot";

const everynoiseUrl = "https://everynoise.com";

export const everynoiseKy = ky.create({
  baseUrl: everynoiseUrl,
});

export const getAllGenres = createServerFn().handler(getAllGenres_serverOnly);

export const getGenreBySlug = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const genreSlug = genreNameToSlug(data);

    const scrappy = await Scrappy.init(
      `${everynoiseUrl}/engenremap-${genreSlug}.html`,
    );

    const titleEl = scrappy.find(".title");

    const genreName = scrappy
      .find(".title")
      ?.el.childNodes[1].textContent?.slice(3, -3);

    const artists = scrappy
      .find(".canvas")
      ?.findAll(".genre")
      .map((el) => ({
        artistName: el.childNodes[0].textContent,
        id: el.querySelector<HTMLAnchorElement>("a")?.href?.slice(23),
        color: el.style.getPropertyValue("color"),
        previewUrl: el.getAttribute("preview_url"),
        previewTitle: el.getAttribute("title"),
      }));

    const links = titleEl?.findAll<HTMLAnchorElement>("a").map((e) => ({
      text: e.textContent,
      href: e.href,
    }));

    const relatedGenres = scrappy
      .find("#tunnel")
      ?.find(".canvas")
      ?.findAll(".genre")
      .map((el) => ({
        genreName: el.childNodes[0].textContent!,
        color: el.style.getPropertyValue("color"),
        previewUrl: el.getAttribute("preview_url"),
        previewTitle: el.getAttribute("title"),
      }))
      .filter((g) => g.genreName !== genreName);

    return { genreName, artists, links, relatedGenres };
  });

export const getGenresByArtistId = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const res = await ky
      .get(`${everynoiseUrl}/api/${data}`)
      .text()
      .then(JSON.parse);

    return (Object.values(res)[0] as string[]) ?? [];
  });

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

export async function swipeSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const { access_token, expires_in } = await everynoiseKy("spotify_auth.cgi", {
    searchParams: {
      action: "accesstoken",
      secret: "fetch",
    },
  }).json(
    v.object({
      access_token: v.string(),
      expires_in: v.number(),
    }),
  );

  cachedToken = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  return access_token;
}
