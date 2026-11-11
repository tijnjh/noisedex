import { up } from "up-fetch";

export const upfetch = up(fetch);

export function vtName(strs: TemplateStringsArray, ...args: unknown[]) {
  const selector = strs.map((s, i) => s + (args[i] ?? "")).join("");

  if (!selector) {
    return {};
  }

  return {
    style: {
      viewTransitionName: selector,
    },
  };
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return Intl.DateTimeFormat("en", options).format(date);
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

export function formatMillis(millis: number): string {
  const totalSeconds = Math.trunc(millis / 1000);
  const minutes = Math.trunc(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
