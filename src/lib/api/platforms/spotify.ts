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

    // artists without images are almost always empty placeholder profiles
    return spotifyRes.artists.items.filter((artist) => artist.images.length > 0);
  });
