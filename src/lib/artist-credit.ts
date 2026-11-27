import { Effect } from "effect";

export interface CreditedArtist {
  name: string;
  artistId?: number | undefined;
}

const creditSeparator = /\s*,\s*|\s+&\s+/;

export const nameKey = (name: string) => {
  const words = name.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

  return words.join(" ");
};

export function splitArtistCredit(credit: string, knownNames: string[] = []) {
  const known = knownNames.filter((name) => creditSeparator.test(name));

  let masked = credit;

  known.forEach((name, i) => {
    masked = masked.replaceAll(name, `\0${i}\0`);
  });

  return masked
    .split(creditSeparator)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\0(\d+)\0/g, (_, i: string) => known[Number(i)]));
}

// itunes only ids the first artist, its full name shows where it ends
export function resolveCredit(
  credit: string,
  artistId: number,
  artistName: (id: number) => Effect.Effect<string | null>,
): Effect.Effect<CreditedArtist[]> {
  if (!creditSeparator.test(credit)) return Effect.succeed([{ name: credit, artistId }]);

  return artistName(artistId).pipe(
    Effect.map((firstName) => {
      const [first = credit, ...rest] = splitArtistCredit(credit, firstName ? [firstName] : []);

      return [{ name: first, artistId }, ...rest.map((name) => ({ name }))];
    }),
  );
}
