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

const availableChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function encodeItunesId(id: number) {
  let encoded = "";

  do {
    encoded = availableChars[id % 64] + encoded;
    id = Math.floor(id / 64);
  } while (id > 0);

  return encoded;
}

export function parseItunesId(value: string) {
  if (/^\d{9,}$/.test(value)) {
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : undefined;
  }

  if (!/^[\w-]{1,9}$/.test(value)) {
    return;
  }

  let id = 0;

  for (const char of value) {
    id = id * 64 + availableChars.indexOf(char);
  }

  return Number.isSafeInteger(id) && id > 0 && encodeItunesId(id) === value
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
