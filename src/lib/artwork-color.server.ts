import { cached } from "./cache.server";
import { Vibrant } from "node-vibrant/node";

// accent tints the backdrop effects and surfaces, background tints the page behind them,
// and the top gradient runs from accent through middle into background
export const extractArtworkColors = cached(async (url: string) => {
  const source = new URL(url);
  if (source.protocol !== "https:" || !source.hostname.endsWith(".mzstatic.com")) {
    throw new Error("Not an itunes artwork url");
  }

  const response = await fetch(source, { signal: AbortSignal.timeout(3000), redirect: "error" });
  if (!response.ok) throw new Error("Artwork unavailable");

  const image = Buffer.from(await response.arrayBuffer());
  const palette = await Vibrant.from(image).getPalette();

  const accent = palette.Vibrant?.hex ?? palette.Muted?.hex;
  const background = palette.LightMuted?.hex ?? palette.LightVibrant?.hex ?? accent;
  // the first other swatch, so the gradient doesn't just repeat one of its ends
  const middle = [palette.LightVibrant, palette.Muted, palette.DarkVibrant]
    .map((swatch) => swatch?.hex)
    .find((hex) => hex && hex !== accent && hex !== background);

  return { accent: toP3(accent), middle: toP3(middle), background: toP3(background) };
});

// reuses the srgb channels as display-p3 ones, so the color keeps its character but gets more vivid
function toP3(hex?: string) {
  if (!hex) return;

  const channels = [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));

  return `color(display-p3 ${channels.join(" ")})`;
}
