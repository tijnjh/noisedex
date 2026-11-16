// itunes marks singles and EPs with a suffix on the collection name
const releaseSuffix = / - (Single|EP)$/i;

export type ReleaseType = "LP" | "EP" | "Single";

export function getReleaseType(collectionName: string): ReleaseType {
  const suffix = collectionName.match(releaseSuffix)?.[1].toLowerCase();
  if (suffix === "single") return "Single";
  if (suffix === "ep") return "EP";
  return "LP";
}

export function trimItunesCollectionPostfix(collectionName: string) {
  return collectionName.replace(releaseSuffix, "");
}

export function isSingleRelease(collectionName: string, trackCount: number) {
  return getReleaseType(collectionName) === "Single" && trackCount === 1;
}

export const releaseFilters = ["All", "LPs", "EPs", "Singles"] as const;
export type ReleaseFilter = (typeof releaseFilters)[number];

export function matchesReleaseFilter(collectionName: string, filter: ReleaseFilter) {
  return filter === "All" || `${getReleaseType(collectionName)}s` === filter;
}

export function getBigItunesArtwork({ artworkUrl100 }: { artworkUrl100: string }) {
  return artworkUrl100.replace("100x100bb", "600x600bb");
}

const availableChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function encodeItunesId(id: number) {
  let encoded = "";

  do {
    encoded = availableChars[id % 64] + encoded;
    id = Math.floor(id / 64);
  } while (id > 0);

  return encoded;
}

export function parseItunesId(value: string) {
  if (!/^[\w-]{1,8}$/.test(value)) return;

  let id = 0;

  for (const char of value) {
    id = id * 64 + availableChars.indexOf(char);
  }

  return id;
}
