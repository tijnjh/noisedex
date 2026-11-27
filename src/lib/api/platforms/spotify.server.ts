import { fetchJson } from "#lib/fetch.server";
import { Schema } from "effect";

const TokenResponse = Schema.Struct({ access_token: Schema.String, expires_in: Schema.Number });

const SearchResponse = Schema.Struct({
  artists: Schema.Struct({
    items: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        images: Schema.Array(Schema.Unknown),
      }),
    ),
  }),
});

let token: { value: string; expiresAt: number } | undefined;

// everynoise hands out spotify access tokens
async function getToken() {
  if (token && Date.now() < token.expiresAt) return token.value;

  const { access_token, expires_in } = Schema.decodeUnknownSync(TokenResponse)(
    await fetchJson("https://everynoise.com/spotify_auth.cgi", {
      timeout: 4000,
      params: { action: "accesstoken", secret: "fetch" },
    }),
  );

  token = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}

export async function searchArtists(name: string) {
  const { artists } = Schema.decodeUnknownSync(SearchResponse)(
    await fetchJson("https://api.spotify.com/v1/search", {
      timeout: 4000,
      headers: { Authorization: `Bearer ${await getToken()}` },
      params: { type: "artist", q: name, limit: 50 },
    }),
  );

  // artists without images are almost always empty placeholder profiles
  return artists.items.filter((artist) => artist.images.length > 0);
}
