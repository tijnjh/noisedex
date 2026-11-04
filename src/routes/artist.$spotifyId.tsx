import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { SpotifyWidget } from "#components/spotify-widget";
import { $everynoise, $itunes, $spotify } from "#lib/api/index";
import { siteName, siteUrl } from "#lib/constants";
import { genreNameToSlug, trimItunesCollectionPostfix } from "#lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ResultAlbum } from "itunes-store-api";

export const Route = createFileRoute("/artist/$spotifyId")({
  loader: async ({ params }) => {
    const spotifyArtist = await $spotify.getArtistById({
      data: params.spotifyId,
    });

    const itunesArtistAlbums = await $itunes.getAlbumsByArtistName({
      data: spotifyArtist.name,
    });

    const everynoiseArtistGenres = await $everynoise.getGenresByArtistId({
      data: params.spotifyId,
    });

    return {
      spotifyArtist,
      itunesArtistAlbums,
      everynoiseArtistGenres,
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
  const data = Route.useLoaderData();
  const encodedArtistName = encodeURIComponent(data.spotifyArtist.name);

  return (
    <Layout
      header={{
        title: data.spotifyArtist.name,
      }}

      leading={
        <>
          <SpotifyWidget
            id={params.spotifyId}
            type="artist"
            className="h-38!"
          />

          <PlatformLinks
            links={[
              {
                name: "last.fm",
                icon: "/last-fm.ico",
                href: `https://last.fm/music/${encodedArtistName}`,
              },
              {
                name: "spotify",
                icon: "/spotify-com.png",
                href: `https://open.spotify.com/artist/${params.spotifyId}`,
              },
              ...(data.itunesArtistAlbums.artistId
                ? [
                    {
                      name: "apple music",
                      icon: "/music-apple-com.png",
                      href: `https://music.apple.com/artist/${data.itunesArtistAlbums.artistId}`,
                    },
                  ]
                : []),
              {
                name: "AOTY",
                href: `https://www.albumoftheyear.org/search/artists/?q=${encodedArtistName}`,
              },
              {
                name: "RYM",
                href: `https://rateyourmusic.com/artist/${encodedArtistName}-1`,
              },
              {
                name: "bandcamp",
                icon: "/bandcamp-com.png",
                href: `https://bandcamp.com/search?q=${encodedArtistName}&item_type=b`,
              },
              {
                name: "soundcloak",
                // icon: "/sc-maid-zone.png",
                href: `https://sc.maid.zone/search?q=${encodedArtistName}&type=users`,
              },
            ]}
          />

          {data.everynoiseArtistGenres.length > 0 && (
            <>
              <span className="section-divider">genres this artist is in</span>

              <div className="cool-grid">
                {data.everynoiseArtistGenres.map((genre) => (
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

      trailing={
        <ArtistReleasesList releases={data.itunesArtistAlbums.albums} />
      }
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
    <div className="lg:overflow-y-auto">
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

function organizeArtistReleases(releases: ResultAlbum[]) {
  // remove cleaned version
  releases = releases.filter((r) => r.collectionExplicitness !== "cleaned");

  const albums: ResultAlbum[] = [];
  const eps: ResultAlbum[] = [];
  const singles: ResultAlbum[] = [];

  for (const release of releases) {
    const name = release.collectionName;

    switch (true) {
      case name.endsWith(" - Single"):
        singles.push(release);
        break;

      case name.endsWith(" - EP"):
        eps.push(release);
        break;

      default:
        albums.push(release);
        break;
    }
  }

  return { albums, eps, singles };
}
