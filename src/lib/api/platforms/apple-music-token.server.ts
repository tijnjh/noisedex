import { upfetch } from "#lib/utils";

// the apple music web player ships a public developer token in its js bundle.
// it only works for requests with an apple.com origin, so this is server-only.

const webPlayerTokenPattern =
  /eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IldlYlBsYXlLaWQifQ\.[\w-]+\.[\w-]+/;

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

export function invalidateAppleMusicToken() {
  cachedToken = null;
}

export async function swipeAppleMusicToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const html = await upfetch("https://music.apple.com/us/browse", {
    timeout: 4000,
    parseResponse: (response) => response.text(),
  });

  const bundlePath = html.match(/\/assets\/index[^"]*\.js/)?.[0];
  if (!bundlePath) throw new Error("Apple Music: web player bundle not found");

  const bundle = await upfetch(`https://music.apple.com${bundlePath}`, {
    timeout: 8000,
    parseResponse: (response) => response.text(),
  });

  const token = bundle.match(webPlayerTokenPattern)?.[0];
  if (!token) throw new Error("Apple Music: web player token not found");

  cachedToken = { token, expiresAt: tokenExpiry(token) };

  return token;
}

function tokenExpiry(token: string) {
  const fallback = Date.now() + 24 * 60 * 60_000;

  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
      exp?: number;
    };
    // refresh an hour early so a request never goes out with a token about to expire
    return payload.exp ? payload.exp * 1000 - 60 * 60_000 : fallback;
  } catch {
    return fallback;
  }
}
