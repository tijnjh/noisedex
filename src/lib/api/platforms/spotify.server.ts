import { up } from "up-fetch";
import * as v from "valibot";

const upfetch = up(fetch, () => ({ timeout: 4000 }));

let token: { value: string; expiresAt: number } | undefined;

// everynoise hands out spotify access tokens
async function getToken() {
  if (token && Date.now() < token.expiresAt) return token.value;

  const { access_token, expires_in } = await upfetch("https://everynoise.com/spotify_auth.cgi", {
    params: { action: "accesstoken", secret: "fetch" },
    schema: v.object({ access_token: v.string(), expires_in: v.number() }),
  });

  token = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}

export async function searchArtists(name: string) {
  const { artists } = await upfetch("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${await getToken()}` },
    params: { type: "artist", q: name, limit: 50 },
    schema: v.object({
      artists: v.object({
        items: v.array(
          v.object({ id: v.string(), name: v.string(), images: v.array(v.unknown()) }),
        ),
      }),
    }),
  });

  // artists without images are almost always empty placeholder profiles
  return artists.items.filter((artist) => artist.images.length > 0);
}
