import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $spotify, $soundcloud } from "#lib/api/index";
import { formatReleaseDate } from "#lib/api/platforms/spotify-data";
import { siteName, siteUrl } from "#lib/constants";
import { musicMetadata } from "#lib/music-metadata";
import { trackLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { storeCountryFromLanguages } from "#lib/store-country";
import { formatMillis } from "#lib/utils";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

// The only legacy support: resolve numeric IDs to a Spotify page, never render them.
const resolveNumericId = createServerFn()
  .validator(v.pipe(v.string(), v.regex(/^\d+$/)))
  .handler(async ({ data }) => {
    try {
      const country = storeCountryFromLanguages(
        getRequestHeader("accept-language"),
      );
      const response = await fetch(
        `https://itunes.apple.com/lookup?id=${data}&country=${country}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) return null;
      const { results } = await response.json();
      const legacy = results.find(
        (item: { wrapperType: string }) => item.wrapperType === "track",
      );
      if (!legacy?.trackName || !legacy.artistName) return null;
      const normalize = (name: string) =>
        name
          .replace(/ - (Single|EP)$/i, "")
          .trim()
          .toLowerCase();
      const matches = await $spotify.searchMusic({
        data: `${legacy.artistName} ${normalize(legacy.trackName)}`,
      });
      return (
        matches.tracks.find(
          (item) =>
            normalize(item.name) === normalize(legacy.trackName) &&
            item.artists.some(
              (artist) =>
                normalize(artist.name) === normalize(legacy.artistName),
            ) &&
            Math.abs(item.duration_ms - legacy.trackTimeMillis) <= 2000,
        )?.id ?? null
      );
    } catch {
      return null;
    }
  });

export const Route = createFileRoute("/track/$id")({
  loader: async ({ params }) => {
    if (/^\d+$/.test(params.id)) {
      const id = await resolveNumericId({ data: params.id });
      if (!id) throw notFound();
      throw redirect({ to: "/track/$id", params: { id }, replace: true });
    }
    if (!/^[A-Za-z0-9]{22}$/.test(params.id)) throw notFound();
    const track = await $spotify.getTrack({ data: params.id });
    if (!track) throw notFound();
    const query = {
      artist: track.album.artists[0]?.name ?? "",
      album: track.album.name,
    };
    const soundcloud = await $soundcloud.matchAlbum({ data: query });
    return { track, soundcloud };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { track } = loaderData;
    const artistName = track.artists.map((a) => a.name).join(", ");
    return musicMetadata({
      title: `${track.name} by ${artistName} | ${siteName}`,
      description: `Explore ${track.name} by ${artistName} from ${track.album.name}: release date and listening links.`,
      url: `${siteUrl}/track/${params.id}`,
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
          url: `${siteUrl}/album/${track.album.id}`,
        },
        datePublished: track.album.release_date,
        duration: `PT${Math.round(track.duration_ms / 1000)}S`,
      },
    });
  },
  component: TrackPage,
});

function TrackPage() {
  const { track, soundcloud } = Route.useLoaderData();
  const album = track.album;
  const artistName = track.artists.map((a) => a.name).join(", ");
  const url = $soundcloud.trackUrl(
    soundcloud,
    track.name,
    track.artists[0]?.name ?? "",
  );
  return (
    <Layout
      header={{ title: track.name, backHref: `/album/${album.id}` }}
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
              <span>Listen on SoundCloud</span>
            </div>
          ) : (
            <p className="opacity-60">No audio available for this track.</p>
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
            to="/album/$id"
            params={{ id: album.id }}
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
