import { nameKey, splitArtistCredit, type CreditedArtist } from "#lib/artist-credit";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

export interface Collaborator extends CreditedArtist {
  releases: number;
}

const featuredCredit = /[([](?:feat\.?|ft\.?|featuring|with)\s+([^)\]]+)[)\]]/gi;

// dj mixes credit everyone they mash together
const djMix = /\(DJ Mix\)|[[(]Mixed[\])]/i;

export function findCollaborators(
  artist: { artistName: string },
  releases: (ResultAlbum | ResultMusicTrack)[],
): Collaborator[] {
  const selfKey = nameKey(artist.artistName);

  const found = new Map<string, { name: string; artistId?: number; releases: Set<number> }>();

  const splitCredit = (credit: string) => splitArtistCredit(credit, [artist.artistName]);

  for (const release of releases) {
    const title = "trackName" in release ? release.trackName : release.collectionName;

    if (djMix.test(release.collectionName) || djMix.test(title)) continue;

    const names = splitCredit(release.artistName);

    const firstCreditKey = nameKey(names[0] ?? "");

    for (const [, featured] of title.matchAll(featuredCredit)) {
      names.push(...splitCredit(featured));
    }

    for (const name of names) {
      const key = nameKey(name);

      if (!key || key === selfKey) continue;

      const entry = found.get(key) ?? { name, releases: new Set() };

      if (!entry.artistId && key === firstCreditKey) {
        entry.artistId = release.artistId;
      }

      entry.releases.add(release.collectionId);

      found.set(key, entry);
    }
  }

  const collaborators = [...found.values()].map(({ name, artistId, releases }) => ({
    name,
    artistId,
    releases: releases.size,
  }));

  return collaborators.sort((a, b) => b.releases - a.releases || a.name.localeCompare(b.name));
}
