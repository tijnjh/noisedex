import { everynoiseUrl } from "./constants";

// i tested this against all 6000 genres
export function genreNameToSlug(genre: string | undefined | null) {
  if (!genre) return;
  return genre.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

export function fixRelativeUrl(url: string) {
  if (url.startsWith("http")) return url;
  return everynoiseUrl + url;
}

export function findSoundOfPlaylistId(
  links: Array<{ text: string; href: string }>,
) {
  const fullUrl = links.find((l) => l.text === "playlist")?.href;
  if (!fullUrl) return;
  return fullUrl.replace("https://open.spotify.com/playlist/", "");
}

export function fmt(
  as: "date",
  subject: Date,
  opts?: Intl.DateTimeFormatOptions,
): string;
export function fmt(
  as: "number",
  subject: number,
  opts?: Intl.NumberFormatOptions,
): string;
export function fmt(
  as: "number" | "date",
  subject: number | Date,
  opts?: object,
): string {
  const locale = "en";

  switch (as) {
    case "date":
      return Intl.DateTimeFormat(locale, opts).format(subject);

    case "number":
      return Intl.NumberFormat(locale, opts).format(subject as number);
  }
}

export function getErrorMessage(error: unknown) {
  const genericMsg = "an unknown error occurred, check logs for more info";

  switch (typeof error) {
    case "undefined":
      return genericMsg;

    case "string":
      return error;

    case "object":
      if (error === null) return genericMsg;
      if ("message" in error) return error.message as string;
      return JSON.stringify(error);

    default:
      return genericMsg;
  }
}

export function isIos() {
  if (typeof navigator === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type AwaitedObject<T> = {
  [K in keyof T]: Awaited<T[K]>;
};

export async function parallelize<const T extends Record<PropertyKey, unknown>>(
  input: T,
) {
  const keys = Reflect.ownKeys(input) as Array<keyof T>;
  const values = await Promise.all(keys.map((key) => input[key]));

  return Object.fromEntries(
    keys.map((key, index) => [key, values[index]]),
  ) as AwaitedObject<T>;
}

export function trimItunesCollectionPostfix(collectionName: string) {
  return collectionName.replace(" - Single", "").replace(" - EP", "");
}

function colorCoordinates(hex: string) {
  let value = hex.replace(/^#/, "");

  if (value.length === 3)
    value = [...value].map((digit) => digit + digit).join("");

  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = channels;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI - 15 + 360) % 360;

  return { hue, lightness, chroma };
}

export function sortHexColorsToGradient<T>(
  items: T[],
  getColor: (item: T) => string,
): T[] {
  return items
    .map((item) => ({ item, ...colorCoordinates(getColor(item)) }))
    .sort((a, b) => {
      const hueA = Math.floor(a.hue / 15);
      const hueB = Math.floor(b.hue / 15);
      if (hueA !== hueB) return hueA - hueB;

      const direction = hueA % 2 === 0 ? 1 : -1;
      const lightnessA = Math.floor(a.lightness / 0.05);
      const lightnessB = Math.floor(b.lightness / 0.05);
      return (
        direction * (lightnessA - lightnessB) ||
        direction * (lightnessA % 2 === 0 ? 1 : -1) * (a.chroma - b.chroma) ||
        direction * (a.lightness - b.lightness) ||
        a.hue - b.hue
      );
    })
    .map(({ item }) => item);
}

export function getBigItunesArtwork({
  artworkUrl100,
}: {
  artworkUrl100: string;
}) {
  return artworkUrl100.replace("100x100bb", "600x600bb");
}
