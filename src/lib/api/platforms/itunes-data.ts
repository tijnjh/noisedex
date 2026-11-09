import type { ResultAlbum } from "itunes-store-api";

export function trimItunesCollectionPostfix(collectionName: string) {
  return collectionName.replace(" - Single", "").replace(" - EP", "");
}

export function getBigItunesArtwork({
  artworkUrl100,
}: {
  artworkUrl100: string;
}) {
  return artworkUrl100.replace("100x100bb", "600x600bb");
}

export function isSingleRelease(collectionName: string, trackCount: number) {
  return collectionName.endsWith("- Single") && trackCount === 1;
}

export function parseItunesId(value: string) {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0
    ? id
    : undefined;
}

export function organizeArtistReleases(releases: ResultAlbum[]) {
  const sections: Record<"albums" | "eps" | "singles", ResultAlbum[]> = {
    albums: [],
    eps: [],
    singles: [],
  };
  for (const release of releases) {
    if (release.collectionExplicitness === "cleaned") continue;
    const section = release.collectionName.endsWith(" - Single")
      ? "singles"
      : release.collectionName.endsWith(" - EP")
        ? "eps"
        : "albums";
    sections[section].push(release);
  }
  return sections;
}

export function getReleaseType(collectionName: string) {
  if (/ - Single$/i.test(collectionName)) return "Single";
  if (/ - EP$/i.test(collectionName)) return "EP";
  return "LP";
}
