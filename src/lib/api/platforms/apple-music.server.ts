import { invalidateAppleMusicToken, swipeAppleMusicToken } from "./apple-music-token.server";
import { cached } from "#lib/cache.server";
import type { StoreCountry } from "#lib/store-country";
import { upfetch } from "#lib/utils";
import { isResponseError } from "up-fetch";
import * as v from "valibot";

const artworkSchema = v.object({
  url: v.string(),
  width: v.number(),
  height: v.number(),
  bgColor: v.optional(v.string()),
  textColor1: v.optional(v.string()),
});

const artistSchema = v.object({
  data: v.array(
    v.object({
      attributes: v.object({
        artwork: v.optional(artworkSchema),
        editorialArtwork: v.optional(
          v.object({
            // the transparent name logo artists upload via apple music for artists
            musicContentColorLogoTrimmed: v.optional(artworkSchema),
          }),
        ),
      }),
    }),
  ),
});

type Artwork = v.InferOutput<typeof artworkSchema>;

export type AppleMusicImage = {
  url: string;
  width: number;
  height: number;
  bgColor?: string;
};

export type AppleMusicArtistImages = {
  profileImage: AppleMusicImage | null;
  logo: AppleMusicImage | null;
};

async function fetchArtist(artistId: number, country: StoreCountry, retry = true) {
  try {
    return await upfetch(
      `https://amp-api.music.apple.com/v1/catalog/${country}/artists/${artistId}`,
      {
        timeout: 4000,
        params: { extend: "editorialArtwork" },
        headers: {
          Authorization: `Bearer ${await swipeAppleMusicToken()}`,
          Origin: "https://music.apple.com",
        },
        schema: artistSchema,
      },
    );
  } catch (error) {
    if (!isResponseError(error)) throw error;
    // the scraped token got rotated
    if (error.status === 401 && retry) {
      invalidateAppleMusicToken();
      return fetchArtist(artistId, country, false);
    }
    // artist isn't in this storefront
    if (error.status === 404 && country !== "us") return fetchArtist(artistId, "us", retry);
    if (error.status === 404) return null;
    throw error;
  }
}

export const getArtistImages = cached(
  async (artistId: number, country: StoreCountry): Promise<AppleMusicArtistImages> => {
    const attributes = (await fetchArtist(artistId, country))?.data[0]?.attributes;

    const profileImage = attributes?.artwork;
    const logo = attributes?.editorialArtwork?.musicContentColorLogoTrimmed;

    return {
      profileImage: profileImage ? toImage(profileImage, 1200, "jpg") : null,
      // png keeps the transparency, the template defaults to jpg
      logo: logo ? toImage(logo, 1200, "png") : null,
    };
  },
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
);

function toImage(artwork: Artwork, maxWidth: number, format: "jpg" | "png"): AppleMusicImage {
  const width = Math.min(maxWidth, artwork.width);
  const height = Math.round((width * artwork.height) / artwork.width);

  return {
    url: artwork.url
      .replace("{w}", String(width))
      .replace("{h}", String(height))
      .replace("{c}", "bb")
      .replace(/\.(\{f\}|jpg|png|webp)$/, `.${format}`),
    width,
    height,
    bgColor: artwork.bgColor && `#${artwork.bgColor}`,
  };
}
