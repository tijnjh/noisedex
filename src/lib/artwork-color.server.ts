import { Vibrant } from "node-vibrant/node";

const colors = new Map<string, Promise<string | undefined>>();

export function extractArtworkColor(url: string) {
  const cached = colors.get(url);
  if (cached) return cached;

  const color = extract(url);

  if (colors.size >= 500) colors.delete(colors.keys().next().value!);
  colors.set(url, color);

  return color;
}

async function extract(url: string) {
  try {
    const source = new URL(url);
    if (source.protocol !== "https:" || !source.hostname.endsWith(".mzstatic.com")) return;

    const response = await fetch(source, {
      signal: AbortSignal.timeout(3000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Artwork unavailable");

    const image = Buffer.from(await response.arrayBuffer());
    const palette = await Vibrant.from(image).getPalette();

    return palette.Vibrant?.hex ?? palette.Muted?.hex;
  } catch {
    colors.delete(url);
    return;
  }
}
