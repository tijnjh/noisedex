import { everynoiseUrl } from "./genres";
import ky from "ky";
import * as v from "valibot";

export interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl?: string;
}

/** The spotify port, as noisedex uses it. */
export interface SpotifyClient {
  searchArtists(query: string): Promise<SpotifyArtist[]>;
  getArtist(id: string): Promise<SpotifyArtist>;
}

type TokenFetcher = () => Promise<{ accessToken: string; expiresIn: number }>;

/** caches an access token until it expires */
function createTokenProvider(fetchToken: TokenFetcher) {
  let cached: { accessToken: string; expiresAt: number } | null = null;

  return async () => {
    if (cached && Date.now() < cached.expiresAt) return cached.accessToken;

    const { accessToken, expiresIn } = await fetchToken();
    cached = { accessToken, expiresAt: Date.now() + expiresIn * 1000 };
    return accessToken;
  };
}

// everynoise hands out spotify access tokens, so we borrow one of theirs
const everynoiseToken: TokenFetcher = async () => {
  const { access_token, expires_in } = await ky(
    `${everynoiseUrl}/spotify_auth.cgi`,
    { searchParams: { action: "accesstoken", secret: "fetch" } },
  ).json(v.object({ access_token: v.string(), expires_in: v.number() }));

  return { accessToken: access_token, expiresIn: expires_in };
};

const artistSchema = v.object({
  id: v.string(),
  name: v.string(),
  images: v.array(v.object({ url: v.string() })),
});

function toArtist(artist: v.InferOutput<typeof artistSchema>): SpotifyArtist {
  // spotify sorts images largest first
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images.at(-1)?.url,
  };
}

export function createSpotify(
  getToken: () => Promise<string> = createTokenProvider(everynoiseToken),
): SpotifyClient {
  const api = ky.create({
    baseUrl: "https://api.spotify.com",
    prefix: "v1",
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          request.headers.set("Authorization", `Bearer ${await getToken()}`);
        },
      ],
    },
  });

  return {
    async searchArtists(query) {
      const response = await api("search", {
        searchParams: { type: "artist", q: query, limit: 50 },
      }).json(
        v.object({ artists: v.object({ items: v.array(artistSchema) }) }),
      );

      // artists without images are mostly low quality duplicates
      return response.artists.items
        .filter((artist) => artist.images.length)
        .map(toArtist);
    },

    async getArtist(id) {
      return toArtist(
        await api(`artists/${encodeURIComponent(id)}`).json(artistSchema),
      );
    },
  };
}
