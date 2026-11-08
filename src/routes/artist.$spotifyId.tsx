import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { SpotifyWidget } from "#components/spotify-widget";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $everynoise, $itunes, $spotify, $wikipedia } from "#lib/api/index";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { organizeArtistReleases } from "#lib/api/platforms/itunes-data";
import { trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { siteName, siteUrl } from "#lib/constants";
import { artistLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute } from "@tanstack/react-router";
import { ResultAlbum } from "itunes-store-api";

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
          <SpotifyWidget
            id={params.spotifyId}
            type="artist"
            className="h-38!"
          />

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
  const organizedReleases = organizeArtistReleases(props.releases);
  const sections = Object.entries(organizedReleases).filter(
    ([, releases]) => releases.length > 0,
  );

  if (!sections.length) return <p role="status">No releases found.</p>;

  return (
    <div
      data-scroll-restoration-id={scrollRegions.content}
      className="lg:overflow-y-auto"
    >
      {sections.map(([name, releases]) => (
        <div key={name} className="flex flex-col gap-3">
          <span className="section-divider">{name}</span>

          <div className="cool-grid">
            {releases.map((release) => (
              <Chip
                key={release.collectionId}
                leading={release.artworkUrl60}
                to="/album/$itunesId"
                params={{ itunesId: String(release.collectionId) }}
              >
                {trimItunesCollectionPostfix(release.collectionName)}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
