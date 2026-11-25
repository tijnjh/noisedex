import { AsyncContent } from "#components/async-content";
import { Chip } from "#components/chip";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { splitArtistCredit, type CreditedArtist } from "#lib/artist-credit";

export function ArtistChip({
  name,
  artistId,
  vt,
}: CreditedArtist & {
  vt?: string;
}) {
  if (artistId) {
    return (
      <Chip
        to="/$itunesId"
        params={{ itunesId: encodeItunesId(artistId) }}
        vt={vt ? { title: vt } : undefined}
      >
        {name}
      </Chip>
    );
  }

  return (
    <Chip to="/search" search={{ q: name, lucky: true }}>
      {name}
    </Chip>
  );
}

export function ArtistChips({
  credit,
  artists,
  vt,
}: {
  credit: string;
  artists: Promise<CreditedArtist[]>;
  vt?: string;
}) {
  const sample = splitArtistCredit(credit).map((name) => ({ name }));

  return (
    <AsyncContent promise={artists} sample={sample} label="Loading artists">
      {(artists) =>
        artists.map((artist, i) => (
          <ArtistChip key={artist.name} {...artist} vt={i === 0 ? vt : undefined} />
        ))
      }
    </AsyncContent>
  );
}
