import { upfetch } from "#lib/utils";
import * as v from "valibot";

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

export async function swipeSpotifyToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const { access_token, expires_in } = await upfetch("https://everynoise.com/spotify_auth.cgi", {
    timeout: 4000,
    params: {
      action: "accesstoken",
      secret: "fetch",
    },
    schema: v.object({
      access_token: v.string(),
      expires_in: v.number(),
    }),
  });

  cachedToken = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  return access_token;
}
