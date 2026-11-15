import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { Section } from "#components/section";
import { $itunes } from "#lib/api/index";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { siteName } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as v from "valibot";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: `Search artists, albums, and tracks • ${siteName}` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  validateSearch: v.object({
    q: v.optional(v.string()),
    lucky: v.optional(v.boolean()),
  }),

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ deps: { search } }) => {
    const query = search.q?.trim();
    if (!query) return;

    const artists = $itunes.searchArtists({ data: query });

    if (search.lucky) {
      const [topArtist] = await artists;

      if (topArtist) {
        throw redirect({
          to: "/$itunesId",
          params: { itunesId: encodeItunesId(topArtist.artistId) },
          replace: true,
        });
      }
    }

    const [foundArtists, music] = await Promise.all([
      artists,
      $itunes.searchMusic({ data: query }),
    ]);

    return { artists: foundArtists, ...music };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const results = Route.useLoaderData();

  // no query, so nothing was searched
  if (!results) return <Layout header={{ title: "search" }} />;

  const { artists, albums, tracks } = results;

  return (
    <Layout header={{ title: "search" }}>
      <div
        data-scroll-restoration-id={scrollRegions.content}
        className="flex h-full flex-col gap-3 overflow-y-auto p-3"
      >
        <Results title="artists" label="Artists" count={artists.length}>
          {artists.map((artist) => (
            <Chip
              key={artist.artistId}
              vt={{ title: `artist-${artist.artistId}` }}
              to="/$itunesId"
              params={{ itunesId: encodeItunesId(artist.artistId) }}
            >
              {artist.artistName}
            </Chip>
          ))}
        </Results>

        <Results title="albums" label="Albums" count={albums.length}>
          {albums.map((album) => (
            <MusicChip key={album.collectionId} music={album} showArtist />
          ))}
        </Results>

        <Results title="tracks" label="Tracks" count={tracks.length}>
          {tracks.map((track) => (
            <MusicChip key={track.trackId} music={track} showArtist />
          ))}
        </Results>

        {!artists.length && !albums.length && !tracks.length && (
          <p role="status">No artists, albums, or tracks found.</p>
        )}
      </div>
    </Layout>
  );
}

function Results({
  title,
  label,
  count,
  children,
}: {
  title: string;
  label: string;
  count: number;
  children: ReactNode;
}) {
  if (!count) return;

  return (
    <Section title={title} label={label}>
      <div className="cool-grid">{children}</div>
    </Section>
  );
}
