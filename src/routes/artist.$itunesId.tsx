import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { PlatformLinks } from "#components/platform-links";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $itunes, $wikipedia } from "#lib/api/index";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { getReleaseType, parseItunesId } from "#lib/api/platforms/itunes-data";
import { siteName, siteUrl } from "#lib/constants";
import { artistLinks } from "#lib/platform-links";
import { buildReleaseTimeline } from "#lib/release-timeline";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { cn } from "cn";
import type { ResultAlbum } from "itunes-store-api";
import { Fragment, useState } from "react";

export const Route = createFileRoute("/artist/$itunesId")({
  loader: async ({ params }) => {
    const itunesId = parseItunesId(params.itunesId);
    if (itunesId === undefined) throw notFound();

    const artistData = await $itunes.getArtistById({ data: itunesId });
    if (!artistData) throw notFound();

    const { artist, albums } = artistData;
    const { summary: wikipediaArtist, genres: wikipediaArtistGenres } =
      $wikipedia.enrichWithGenres(
        $wikipedia.getArtistByName({ data: artist.artistName }),
      );

    return {
      artist,
      albums,
      wikipediaArtist,
      wikipediaArtistGenres,
    };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: `${loaderData?.artist.artistName ?? "Artist"} albums | ${siteName}`,
      },
      {
        name: "description",
        content: `Browse albums and music genres for ${loaderData?.artist.artistName ?? "this artist"} on ${siteName}.`,
      },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/artist/${params.itunesId}` }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { artist, albums, wikipediaArtist, wikipediaArtistGenres } =
    Route.useLoaderData();
  const genre = artist.primaryGenreName;

  return (
    <Layout
      header={{ title: artist.artistName }}
      leading={
        <>
          <PlatformLinks
            links={artistLinks(artist.artistName, artist.artistId)}
          />

          <WikipediaDescription
            summary={wikipediaArtist}
            genres={wikipediaArtistGenres}
          />

          {genre && (
            <>
              <span className="section-divider">itunes genre</span>
              <div className="cool-grid">
                <Chip
                  to="/genre/$slug"
                  params={{ slug: genreNameToSlug(genre) }}
                >
                  {genre}
                </Chip>
              </div>
            </>
          )}
        </>
      }
      trailing={<ArtistReleasesList releases={albums} />}
    />
  );
}

function ArtistReleasesList({ releases }: { releases: ResultAlbum[] }) {
  const [filter, setFilter] = useState<"All" | "LPs" | "EPs" | "Singles">(
    "All",
  );
  const timeline = buildReleaseTimeline(
    releases.filter(
      (release) =>
        filter === "All" ||
        getReleaseType(release.collectionName) + "s" === filter,
    ),
  );

  return (
    <div
      aria-label="Release timeline"
      data-scroll-restoration-id={scrollRegions.content}
      className="flex min-w-0 flex-col gap-3 lg:overflow-y-auto"
    >
      <div role="group" aria-label="Release type" className="flex gap-3">
        {(["All", "LPs", "EPs", "Singles"] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={filter === type}
            onClick={() => setFilter(type)}
            className={cn(
              "cursor-pointer",
              filter === type ? "btn-inverse h-9" : "btn h-9",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {!timeline.length && <p role="status">No releases found.</p>}

      {timeline.map(({ release, year, showYear, month, dateTime }) => (
        <Fragment key={release.collectionId}>
          {showYear && (
            <h2 className="flex h-9 items-center gap-3 font-semibold tabular-nums not-first:mt-6">
              {year ?? "Unknown date"}
              <span className="grow border-t border-zinc-300-700" />
            </h2>
          )}

          <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-right font-mono text-sm opacity-50">
              {month && <time dateTime={dateTime}>{month}</time>}
            </span>
            <MusicChip music={release} />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
