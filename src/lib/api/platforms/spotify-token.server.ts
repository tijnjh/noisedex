import { everynoiseUrl } from "./everynoise-data";
import ky from "ky";
import * as v from "valibot";

const everynoiseKy = ky.create({ baseUrl: everynoiseUrl });

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
