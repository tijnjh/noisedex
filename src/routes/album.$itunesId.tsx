import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $itunes, $soundcloud, $wikipedia } from "#lib/api/index";
import { siteName, siteUrl } from "#lib/constants";
import {
  fmt,
  getBigItunesArtwork,
  trimItunesCollectionPostfix,
} from "#lib/utils";
import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";

export const Route = createFileRoute("/album/$itunesId")({
  loader: async ({ params }) => {
    if (!/^\d+$/.test(params.itunesId)) throw notFound();

    const response = await $itunes.isa.lookup("id", Number(params.itunesId), {
      media: "music",
      entity: "song",
    });

    // for some reason the first result of a song query on an album returns the album itself..
    // weird but not complaining since it saves us a request :)
    const album = response.results[0] as unknown as Itunes.ResultAlbum;
    if (album?.collectionType !== "Album") throw notFound();

    const tracks = response.results.filter((r) => r.wrapperType === "track");

    const isSingle =
      album.collectionName.endsWith("- Single") && tracks.length === 1;

    if (isSingle) {
      throw redirect({
        throw: true,
        to: "/track/$itunesId",
        params: { itunesId: String(tracks[0].trackId) },
        replace: true,
      });
    }

    const wikipediaAlbum = $wikipedia
      .getAlbumByName({
        data: {
          album: album.collectionName,
          artist: album.artistName,
        },
      })
      .catch(() => null);

    const wikipediaAlbumGenres = wikipediaAlbum
      .then((article) =>
        article ? $wikipedia.getGenresByTitle({ data: article.title }) : [],
      )
      .catch(() => []);

    const soundcloud = await $soundcloud.matchAlbum({
      data: {
        artist: album.artistName,
        album: trimItunesCollectionPostfix(album.collectionName),
      },
    });

    return {
      album,
      tracks,
      soundcloud,
      wikipediaAlbum,
      wikipediaAlbumGenres,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { album, tracks } = loaderData;

    const title = `${album.collectionName} by ${album.artistName} | ${siteName}`;
    const description = `Explore ${album.collectionName} by ${album.artistName}: release date, genre, and ${tracks.length} tracks with previews on ${siteName}.`;
    const url = `${siteUrl}/album/${params.itunesId}`;
    const artwork = getBigItunesArtwork(album);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "music.album" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: artwork },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicAlbum",
            "@id": url,
            url,
            name: album.collectionName,
            byArtist: { "@type": "MusicGroup", name: album.artistName },
            datePublished: album.releaseDate,
            genre: album.primaryGenreName,
            image: artwork,
            numTracks: tracks.length,
            track: tracks.map((track) => ({
              "@type": "MusicRecording",
              name: track.trackName,
              position: track.trackNumber,
              duration: `PT${Math.round(track.trackTimeMillis / 1000)}S`,
            })),
          }).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const router = useRouter();

  const backHref = router.buildLocation({
    to: "/search",
    search: { lucky: true, q: data.album.artistName },
  }).href;

  const streamlinedCollectionName = trimItunesCollectionPostfix(
    data.album.collectionName,
  );

  const constructedSearchQuery = encodeURIComponent(
    `${data.album.artistName} ${streamlinedCollectionName}`,
  );

  return (
    <Layout
      header={{ title: data.album.collectionName, backHref }}
      leading={
        <div className="flex flex-col gap-3">
          <img
            src={getBigItunesArtwork(data.album)}
            alt={`${data.album.collectionName} album cover`}
            className="mx-auto aspect-square w-full max-w-72"
          />

          <Chip to="/search" search={{ lucky: true, q: data.album.artistName }}>
            {data.album.artistName}
          </Chip>
          <p>
            released{" "}
            {fmt("date", new Date(data.album.releaseDate), {
              dateStyle: "long",
            })}
          </p>
          <p
            className="cursor-help"
            title="this genre comes from itunes and is often vague or non-specific"
          >
            genre: {data.album.primaryGenreName}
          </p>

          <PlatformLinks
            links={[
              {
                name: "last.fm",
                icon: "/last-fm.ico",
                href: `https://last.fm/music/${encodeURIComponent(data.album.artistName)}/${encodeURIComponent(streamlinedCollectionName)}`,
              },
              {
                name: "spotify",
                icon: "/spotify-com.png",
                href: `https://open.spotify.com/search/${constructedSearchQuery}`,
              },
              {
                name: "apple music",
                icon: "/music-apple-com.png",
                href: data.album.collectionViewUrl,
              },
              {
                name: "AOTY",
                href: `https://www.albumoftheyear.org/search/albums/?q=${constructedSearchQuery}`,
              },
              {
                name: "RYM",
                href: `https://rateyourmusic.com/release/album/${encodeURIComponent(data.album.artistName)}/${encodeURIComponent(streamlinedCollectionName)}/`,
              },
              {
                name: "bandcamp",
                icon: "/bandcamp-com.png",
                href: `https://bandcamp.com/search?q=${constructedSearchQuery}&item_type=a`,
              },
              {
                name: "soundcloak",
                // icon: "/sc-maid-zone.png",
                href: `https://sc.maid.zone/search?q=${constructedSearchQuery}&type=playlists`,
              },
            ]}
          />
          <WikipediaDescription
            summary={data.wikipediaAlbum}
            genres={data.wikipediaAlbumGenres}
          />
        </div>
      }
      trailing={
        <section
          aria-label="Track list"
          className="flex h-full flex-col gap-3 overflow-x-hidden overflow-y-auto pb-32"
        >
          <h2 className="text-xl font-semibold">Tracks</h2>

          <div className="grid w-full grid-cols-[max-content_1fr] gap-3">
            {data.tracks.map((track) => (
              <div className="col-span-full grid w-full grid-cols-subgrid">
                <div className="flex items-center justify-end">
                  {track.trackNumber}
                </div>

                <Chip
                  key={track.trackId}
                  to={"/track/$itunesId"}
                  params={{ itunesId: String(track.trackId) }}
                  trailing={
                    <PlayButton
                      className="btn-inverse size-9 shrink-0 justify-center"
                      track={{
                        title: track.trackName,
                        url:
                          $soundcloud.trackUrl(
                            data.soundcloud,
                            track.trackName,
                            track.artistName,
                          ) ?? track.previewUrl,
                      }}
                    />
                  }
                >
                  {track.trackName}
                </Chip>
              </div>
            ))}
          </div>
        </section>
      }
    />
  );
}
