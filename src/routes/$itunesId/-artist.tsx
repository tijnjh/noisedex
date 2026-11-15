import { AsyncContent } from "#components/async-content";
import { GenreList } from "#components/genre-list";
import { ContentPane, Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { PlatformLinks } from "#components/platform-links";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $everynoise, $wikipedia } from "#lib/api/index";
import {
  encodeItunesId,
  matchesReleaseFilter,
  releaseFilters,
} from "#lib/api/platforms/itunes-data";
import { siteName } from "#lib/constants";
import { pageHead } from "#lib/head";
import { artistLinks } from "#lib/platform-links";
import { buildReleaseTimeline } from "#lib/release-timeline";
import { getRouteApi } from "@tanstack/react-router";
import type { ResultAlbum, ResultMusicArtist } from "itunes-store-api";
import { Fragment } from "react";

const musicRoute = getRouteApi("/$itunesId/");

type ArtistData = ReturnType<typeof loadArtist>;

// everything beyond the itunes data is left as a promise, so it streams in after the page
export function loadArtist({
  artist,
  albums,
}: {
  artist: ResultMusicArtist;
  albums: ResultAlbum[];
}) {
  const everynoiseArtist = $everynoise.getArtistByName(artist.artistName).catch(() => undefined);

  return {
    artist,
    albums,
    wikipedia: $wikipedia.enrichWithGenres($wikipedia.getArtistByName({ data: artist.artistName })),
    everynoiseArtist,
    accentColor: everynoiseArtist.then((artist) => artist?.style.color),
  };
}

export function artistHead({ artist }: ArtistData) {
  return pageHead({
    title: `${artist.artistName} albums`,
    description: `Browse albums and music genres for ${artist.artistName} on ${siteName}.`,
    path: `/${encodeItunesId(artist.artistId)}`,
  });
}

export function ArtistPage({
  artist,
  albums,
  wikipedia,
  everynoiseArtist,
  accentColor,
}: ArtistData) {
  return (
    <Layout
      header={{
        title: artist.artistName,
        titleVt: `artist-${artist.artistId}`,
      }}
      accentColor={accentColor}
      leading={
        <>
          <PlatformLinks links={artistLinks(artist.artistName, artist.artistId)} />

          <WikipediaDescription {...wikipedia} />

          <AsyncContent<{ genres: string[] } | undefined>
            promise={everynoiseArtist}
            sample={{ genres: ["alternative rock", "indie rock"] }}
            label="Loading artist genres"
          >
            {(result) => (
              <GenreList title="genres this artist is in" names={result?.genres ?? []} />
            )}
          </AsyncContent>

          {artist.primaryGenreName && (
            <GenreList
              title="itunes genre"
              names={[artist.primaryGenreName]}
              className="lg:mb-32"
            />
          )}
        </>
      }
      trailing={<Discography releases={albums} />}
    />
  );
}

function Discography({ releases }: { releases: ResultAlbum[] }) {
  const { filter = "All" } = musicRoute.useSearch();
  const navigate = musicRoute.useNavigate();

  const timeline = buildReleaseTimeline(
    releases.filter((release) => matchesReleaseFilter(release.collectionName, filter)),
  );

  return (
    <ContentPane label="Release timeline">
      <h2 className="section-divider">discography</h2>

      <div role="group" aria-label="Release type" className="flex gap-3">
        {releaseFilters.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={filter === type}
            onClick={() =>
              navigate({
                search: (previous) => ({
                  ...previous,
                  filter: type === "All" ? undefined : type,
                }),
                replace: true,
                resetScroll: false,
              })
            }
            className={filter === type ? "btn-inverse" : "btn"}
          >
            {type}
          </button>
        ))}
      </div>

      {!timeline.length && <p role="status">No releases found.</p>}

      {timeline.map(({ release, year, showYear, month, dateTime }) => (
        <Fragment key={release.collectionId}>
          {showYear && (
            <h2 className="flex h-9 items-center gap-3 font-semibold tabular-nums">
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
      <div className="h-29 shrink-0" />
    </ContentPane>
  );
}
