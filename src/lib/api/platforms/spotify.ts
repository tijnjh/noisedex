import { swipeSpotifyToken } from "./spotify-token.server";
import { createServerFn } from "@tanstack/react-start";
import { up } from "up-fetch";
import * as v from "valibot";

const spotifyFetch = up(fetch, async () => ({
  timeout: 4000,
  baseUrl: "https://api.spotify.com/v1",
  headers: {
    Authorization: `Bearer ${await swipeSpotifyToken()}`,
  },
}));

export const lookupArtists = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const spotifyRes = await spotifyFetch("/search", {
      params: {
        type: "artist",
        q: data,
        limit: 50,
      },
      schema: v.object({
        artists: v.object({
          items: v.array(
            v.object({
              name: v.string(),
              id: v.string(),
              images: v.array(
                v.object({
                  url: v.string(),
                }),
              ),
            }),
          ),
        }),
      }),
    });

    const filteredArtists = spotifyRes.artists.items.filter(
      (i) => !!i.images.length,
    );

    return filteredArtists;
  });

export const getArtistById = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const res = await spotifyFetch(`artists/${data}`, {
      schema: v.object({
        name: v.string(),
        followers: v.object({
          total: v.number(),
        }),
        id: v.string(),
      }),
    });

    return res;
  });
