import { cached } from "./cache.server";
import { Vibrant } from "node-vibrant/node";

export const extractArtworkColor = cached(async (url: string) => {
  const source = new URL(url);
  if (source.protocol !== "https:" || !source.hostname.endsWith(".mzstatic.com")) {
    throw new Error("Not an itunes artwork url");
  }

  const response = await fetch(source, { signal: AbortSignal.timeout(3000), redirect: "error" });
  if (!response.ok) throw new Error("Artwork unavailable");

  const image = Buffer.from(await response.arrayBuffer());
  const palette = await Vibrant.from(image).getPalette();

  return palette.Vibrant?.hex ?? palette.Muted?.hex;
});
