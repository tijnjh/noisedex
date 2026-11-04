import { $everynoise } from "#lib/api/index";
import { createServerFn } from "@tanstack/react-start";
import ky from "ky";
import * as v from "valibot";

export const spotifyKy = ky.create({
  baseUrl: "https://api.spotify.com",
  prefix: "v1",
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        request.headers.set(
          "Authorization",
          `Bearer ${await $everynoise.swipeSpotifyToken()}`,
        );
      },
    ],
  },
});

export const lookupArtists = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const spotifyRes = await spotifyKy("/search", {
      searchParams: {
        type: "artist",
        q: data,
        limit: 50,
      },
    }).json(
      v.object({
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
    );

    // filter out low quality "artists"
    const filteredArtists = spotifyRes.artists.items.filter(
      (i) => !!i.images.length,
    );

    return filteredArtists;
  });

export const getArtistById = createServerFn()
  .validator(v.string())
  .handler(async ({ data }) => {
    const res = await spotifyKy(`artists/${data}`).json(
      v.object({
        name: v.string(),
        followers: v.object({
          total: v.number(),
        }),
        id: v.string(),
      }),
    );

    return res;
  });

export const getAlbumById = createServerFn()
  .validator(v.string())
  .handler(async ({ data: id }) => {
    const res = await spotifyKy(`/albums/${id}`).json(
      v.object({
        name: v.string(),
        id: v.string(),
        external_ids: v.object({ upc: v.string() }),
      }),
    );
    return res;
  });
