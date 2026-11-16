import {
  modeOklch,
  modeRgb,
  useMode as registerMode, // eslint thinks its a react hook lmao
} from "culori/fn";

registerMode(modeRgb); // for parsing hex
const oklch = registerMode(modeOklch);

export function sortHexColorsToGradient<T>(items: T[], getColor: (item: T) => string): T[] {
  return items
    .map((item) => {
      const { l: lightness, c: chroma, h = 0 } = oklch(getColor(item))!;
      return { item, lightness, chroma, hue: (h - 15 + 360) % 360 };
    })
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
