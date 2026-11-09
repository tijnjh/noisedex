import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { PlatformLinks } from "#components/platform-links";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $everynoise, $itunes, $spotify, $wikipedia } from "#lib/api/index";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { siteName, siteUrl } from "#lib/constants";
import { artistLinks } from "#lib/platform-links";
import { buildReleaseTimeline } from "#lib/release-timeline";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute } from "@tanstack/react-router";
import { ResultAlbum } from "itunes-store-api";
import { Fragment } from "react";

export const Route = createFileRoute("/artist/$spotifyId")({
  loader: async ({ params }) => {
    const spotifyArtist = await $spotify.getArtistById({
      data: params.spotifyId,
    });

    const { summary: wikipediaArtist, genres: wikipediaArtistGenres } =
      $wikipedia.enrichWithGenres(
        $wikipedia.getArtistByName({ data: spotifyArtist.name }),
      );

    const [everynoiseArtistGenres, itunesArtistAlbums] = await Promise.all([
      $everynoise.getGenresByArtistId({ data: params.spotifyId }),
      $itunes.getAlbumsByArtistName({ data: spotifyArtist.name }),
    ]);

    return {
      spotifyArtist,
      itunesArtistAlbums,
      everynoiseArtistGenres,
      wikipediaArtist,
      wikipediaArtistGenres,
    };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: `${loaderData?.spotifyArtist.name ?? "Artist"} albums | ${siteName}`,
      },
      {
        name: "description",
        content: `Browse albums and music genres for ${loaderData?.spotifyArtist.name ?? "this artist"} on ${siteName}.`,
      },
    ],
    links: [
      { rel: "canonical", href: `${siteUrl}/artist/${params.spotifyId}` },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  const {
    spotifyArtist,
    itunesArtistAlbums,
    everynoiseArtistGenres,
    wikipediaArtist,
    wikipediaArtistGenres,
  } = Route.useLoaderData();

  return (
    <Layout
      header={{
        title: spotifyArtist.name,
      }}

      leading={
        <>
          <PlatformLinks
            links={artistLinks(
              spotifyArtist.name,
              params.spotifyId,
              itunesArtistAlbums.artistId,
            )}
          />

          <WikipediaDescription
            summary={wikipediaArtist}
            genres={wikipediaArtistGenres}
          />

          {everynoiseArtistGenres.length > 0 && (
            <>
              <span className="section-divider">genres this artist is in</span>

              <div className="cool-grid">
                {everynoiseArtistGenres.map((genre) => (
                  <Chip
                    key={genre}
                    to="/genre/$slug"
                    params={{ slug: genreNameToSlug(genre) }}
                  >
                    {genre}
                  </Chip>
                ))}
              </div>
            </>
          )}
        </>
      }

      trailing={<ArtistReleasesList releases={itunesArtistAlbums.albums} />}
    />
  );
}

function ArtistReleasesList(props: { releases: ResultAlbum[] }) {
  const timeline = buildReleaseTimeline(props.releases);

  if (!timeline.length) return <p role="status">No releases found.</p>;

  return (
    <div
      data-scroll-restoration-id={scrollRegions.content}
      className="min-w-0 lg:overflow-y-auto"
    >
      <div aria-label="Release timeline" className="flex flex-col gap-3">
        {timeline.map(
          ({ release, year, showYear, month, dateTime, gapLabel }) => (
            <Fragment key={release.collectionId}>
              {showYear && (
                <h2 className="flex h-9 items-center gap-3 font-semibold tabular-nums not-first:mt-3">
                  {year ?? "Unknown date"}
                  <span className="grow border-t border-zinc-300-700" />
                </h2>
              )}

              <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm opacity-50">
                  {month && <time dateTime={dateTime}>{month}</time>}
                </span>
                <MusicChip music={release} />
              </div>

              {gapLabel && (
                <div className="ml-13 flex items-center gap-3 py-3 text-sm opacity-50">
                  <span
                    aria-hidden="true"
                    className="h-9 border-l border-dashed"
                  />
                  <span>{gapLabel} between releases</span>
                </div>
              )}
            </Fragment>
          ),
        )}
      </div>
    </div>
  );
}
