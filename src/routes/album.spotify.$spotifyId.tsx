import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $spotify, $soundcloud, $wikipedia } from "#lib/api/index";
import { getAlbumPreviews } from "#lib/api/platforms/music-previews";
import {
  formatReleaseDate,
  spotifyReleaseType,
} from "#lib/api/platforms/spotify-data";
import { siteName, siteUrl } from "#lib/constants";
import { musicMetadata } from "#lib/music-metadata";
import { matchMusicPreview } from "#lib/music-preview-data";
import { albumLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { formatMillis } from "#lib/utils";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/album/spotify/$spotifyId")({
  loader: async ({ params }) => {
    if (!/^[A-Za-z0-9]{22}$/.test(params.spotifyId)) throw notFound();
    const result = await $spotify.getAlbum({ data: params.spotifyId });
    if (!result) throw notFound();
    const { album, tracks } = result;
    const artist = album.artists[0];
    const query = { album: album.name, artist: artist?.name ?? "" };
    const { summary: wikipediaAlbum, genres: wikipediaAlbumGenres } =
      $wikipedia.enrichWithGenres($wikipedia.getAlbumByName({ data: query }));
    const [soundcloud, previews] = await Promise.all([
      $soundcloud.matchAlbum({ data: query }),
      getAlbumPreviews({ data: query }),
    ]);
    return {
      album,
      tracks,
      soundcloud,
      previews,
      wikipediaAlbum,
      wikipediaAlbumGenres,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { album, tracks } = loaderData;
    const artistName = album.artists.map((a) => a.name).join(", ");
    return musicMetadata({
      title: `${album.name} by ${artistName} | ${siteName}`,
      description: `Explore ${album.name} by ${artistName}: release date, tracks, and listening links.`,
      url: `${siteUrl}/album/spotify/${params.spotifyId}`,
      artwork: album.images[0]?.url ?? "",
      type: "music.album",
      recording: {
        "@type": "MusicAlbum",
        name: album.name,
        byArtist: album.artists.map((a) => ({
          "@type": "MusicGroup",
          name: a.name,
        })),
        datePublished: album.release_date,
        numTracks: tracks.length,
        track: tracks.map((t) => ({
          "@type": "MusicRecording",
          name: t.name,
          position: t.track_number,
          duration: `PT${Math.round(t.duration_ms / 1000)}S`,
        })),
      },
    });
  },
  component: AlbumPage,
});

function AlbumPage() {
  const data = Route.useLoaderData();
  const { album, tracks } = data;
  const artist = album.artists[0];
  const multipleDiscs = tracks.some((t) => t.disc_number > 1);
  return (
    <Layout
      header={{
        title: album.name,
        backHref: artist ? `/artist/${artist.id}` : "/search",
      }}
      leading={
        <div className="flex min-w-0 flex-col gap-3">
          {album.images[0] && (
            <img
              src={album.images[0].url}
              alt={`${album.name} album cover`}
              className="mx-auto aspect-square w-full max-w-72"
            />
          )}
          {album.artists.map((a) => (
            <Chip
              key={a.id}
              to="/artist/$spotifyId"
              params={{ spotifyId: a.id }}
            >
              {a.name}
            </Chip>
          ))}
          <p>
            {spotifyReleaseType(album)} · released{" "}
            {formatReleaseDate(album.release_date)}
          </p>
          <PlatformLinks
            links={albumLinks({
              artistName: album.artists.map((a) => a.name).join(", "),
              collectionName: album.name,
              spotifyUrl: album.external_urls.spotify,
            })}
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
          data-scroll-restoration-id={scrollRegions.content}
          className="flex min-w-0 flex-col gap-3 overflow-x-hidden pb-32 lg:overflow-y-auto"
        >
          <h2 className="text-xl font-semibold">Tracks</h2>
          {tracks.length === 0 && <p>No tracks available in this market.</p>}
          <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-3">
            {tracks.map((track) => {
              const artistName = track.artists.map((a) => a.name).join(", ");
              const fullUrl = $soundcloud.trackUrl(
                data.soundcloud,
                track.name,
                track.artists[0]?.name ?? "",
              );
              const url = fullUrl ?? matchMusicPreview(track, data.previews);
              return (
                <div
                  key={track.id}
                  className="col-span-full grid grid-cols-subgrid items-center"
                >
                  <span className="text-sm opacity-60">
                    {multipleDiscs ? `${track.disc_number}.` : ""}
                    {track.track_number}
                  </span>
                  <Chip
                    to="/track/spotify/$spotifyId"
                    params={{ spotifyId: track.id }}
                    trailing={
                      <>
                        <span className="px-2 text-xs opacity-60">
                          {formatMillis(track.duration_ms)}
                        </span>
                        <PlayButton
                          className="btn-inverse size-9 shrink-0 justify-center disabled:opacity-30"
                          title={
                            url
                              ? fullUrl
                                ? "Play on SoundCloud"
                                : "Play preview"
                              : "No audio available"
                          }
                          track={{
                            title: track.name,
                            artist: artistName,
                            artworkSrc: album.images[0]?.url,
                            url,
                          }}
                        />
                      </>
                    }
                  >
                    {track.name}
                  </Chip>
                </div>
              );
            })}
          </div>
        </section>
      }
    />
  );
}
