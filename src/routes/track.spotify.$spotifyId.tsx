import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $spotify, $soundcloud } from "#lib/api/index";
import { getAlbumPreviews } from "#lib/api/platforms/music-previews";
import { formatReleaseDate } from "#lib/api/platforms/spotify-data";
import { siteName, siteUrl } from "#lib/constants";
import { musicMetadata } from "#lib/music-metadata";
import { matchMusicPreview } from "#lib/music-preview-data";
import { trackLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { formatMillis } from "#lib/utils";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/track/spotify/$spotifyId")({
  loader: async ({ params }) => {
    if (!/^[A-Za-z0-9]{22}$/.test(params.spotifyId)) throw notFound();
    const track = await $spotify.getTrack({ data: params.spotifyId });
    if (!track) throw notFound();
    const query = {
      artist: track.album.artists[0]?.name ?? "",
      album: track.album.name,
    };
    const [soundcloud, previews] = await Promise.all([
      $soundcloud.matchAlbum({ data: query }),
      getAlbumPreviews({ data: query }),
    ]);
    return { track, soundcloud, previews };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { track } = loaderData;
    const artistName = track.artists.map((a) => a.name).join(", ");
    return musicMetadata({
      title: `${track.name} by ${artistName} | ${siteName}`,
      description: `Explore ${track.name} by ${artistName} from ${track.album.name}: release date and listening links.`,
      url: `${siteUrl}/track/spotify/${params.spotifyId}`,
      artwork: track.album.images[0]?.url ?? "",
      type: "music.song",
      recording: {
        "@type": "MusicRecording",
        name: track.name,
        byArtist: track.artists.map((a) => ({
          "@type": "MusicGroup",
          name: a.name,
        })),
        inAlbum: {
          "@type": "MusicAlbum",
          name: track.album.name,
          url: `${siteUrl}/album/spotify/${track.album.id}`,
        },
        datePublished: track.album.release_date,
        duration: `PT${Math.round(track.duration_ms / 1000)}S`,
      },
    });
  },
  component: TrackPage,
});

function TrackPage() {
  const { track, soundcloud, previews } = Route.useLoaderData();
  const album = track.album;
  const artistName = track.artists.map((a) => a.name).join(", ");
  const fullUrl = $soundcloud.trackUrl(
    soundcloud,
    track.name,
    track.artists[0]?.name ?? "",
  );
  const url = fullUrl ?? matchMusicPreview(track, previews);
  return (
    <Layout
      header={{ title: track.name, backHref: `/album/spotify/${album.id}` }}
      leading={
        <div className="flex min-w-0 flex-col gap-3">
          {album.images[0] && (
            <img
              src={album.images[0].url}
              alt={`${album.name} album cover`}
              className="mx-auto aspect-square w-full max-w-72"
            />
          )}
          {track.artists.map((a) => (
            <Chip
              key={a.id}
              to="/artist/$spotifyId"
              params={{ spotifyId: a.id }}
            >
              {a.name}
            </Chip>
          ))}
          {url ? (
            <div className="flex items-center gap-3">
              <PlayButton
                className="btn-inverse size-9 shrink-0 justify-center"
                track={{
                  title: track.name,
                  artist: artistName,
                  artworkSrc: album.images[0]?.url,
                  url,
                }}
              />
              <span>
                {fullUrl ? "Listen on SoundCloud" : "Listen to a preview"}
              </span>
            </div>
          ) : (
            <p className="opacity-60">No preview available for this track.</p>
          )}
          <PlatformLinks
            links={trackLinks({
              artistName,
              trackName: track.name,
              spotifyUrl: track.external_urls.spotify,
            })}
          />
        </div>
      }
      trailing={
        <section
          aria-label="Track details"
          data-scroll-restoration-id={scrollRegions.content}
          className="flex min-w-0 flex-col gap-3 pb-32 lg:overflow-y-auto"
        >
          <h2 className="section-divider">from the release</h2>
          <Chip
            to="/album/spotify/$spotifyId"
            params={{ spotifyId: album.id }}
            leading={album.images.at(-1)?.url}
          >
            {album.name}
          </Chip>
          <h2>Track details</h2>
          <dl>
            <dt>released</dt>
            <dd>{formatReleaseDate(album.release_date)}</dd>
            <dt>duration</dt>
            <dd>{formatMillis(track.duration_ms)}</dd>
            <dt>track</dt>
            <dd>{track.track_number}</dd>
            {track.disc_number > 1 && (
              <>
                <dt>disc</dt>
                <dd>{track.disc_number}</dd>
              </>
            )}
            {track.explicit && (
              <>
                <dt>content</dt>
                <dd>explicit</dd>
              </>
            )}
          </dl>
        </section>
      }
    />
  );
}
