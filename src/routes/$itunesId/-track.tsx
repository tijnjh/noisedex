import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $soundcloud } from "#lib/api/index";
import {
  encodeItunesId,
  getBigItunesArtwork,
  isSingleRelease,
} from "#lib/api/platforms/itunes-data";
import { getArtworkColor } from "#lib/artwork-color";
import { siteName, siteUrl } from "#lib/constants";
import { musicMetadata } from "#lib/music-metadata";
import { trackLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { formatDate, vtName } from "#lib/utils";
import { Await, getRouteApi } from "@tanstack/react-router";
import type { ResultMusicTrack } from "itunes-store-api";

const musicRoute = getRouteApi("/$itunesId/");

type TrackData = ReturnType<typeof loadTrack>;

export function loadTrack({ track }: { track: ResultMusicTrack }) {
  const soundcloud = $soundcloud
    .matchAlbum({
      data: { artist: track.artistName, album: track.collectionName },
    })
    .catch(() => []);
  const accentColor = getArtworkColor({ data: track.artworkUrl100 }).catch(
    () => undefined,
  );

  return { track, soundcloud, accentColor };
}

export function trackHead(data: TrackData) {
  const { track } = data;
  const title = `${track.trackName} by ${track.artistName} | ${siteName}`;
  const description = `Explore ${track.trackName} by ${track.artistName} from ${track.collectionName}: release date, genre, and listening links on ${siteName}.`;
  const url = `${siteUrl}/${encodeItunesId(track.trackId)}`;
  const artwork = getBigItunesArtwork(track);

  return musicMetadata({
    title,
    description,
    url,
    artwork,
    type: "music.song",
    recording: {
      "@type": "MusicRecording",
      name: track.trackName,
      byArtist: { "@type": "MusicGroup", name: track.artistName },
      inAlbum: {
        "@type": "MusicAlbum",
        name: track.collectionName,
        url: `${siteUrl}/${encodeItunesId(track.collectionId)}`,
      },
      datePublished: track.releaseDate,
      genre: track.primaryGenreName,
      image: artwork,
      duration: Number.isFinite(track.trackTimeMillis)
        ? `PT${Math.round(track.trackTimeMillis / 1000)}S`
        : undefined,
    },
  });
}

export function TrackPage() {
  const music = musicRoute.useLoaderData();
  if (music.type !== "track") return;
  const data = music.data;

  const { track, soundcloud, accentColor } = data;

  const seconds = Math.floor(track.trackTimeMillis / 1000);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const isSingle = isSingleRelease(track.collectionName, track.trackCount);

  const playback = (fullUrl?: string) => {
    const playbackUrl = fullUrl ?? track.previewUrl;
    return playbackUrl ? (
      <div className="flex items-center gap-3">
        <PlayButton
          className="btn-inverse size-9 shrink-0 justify-center"
          track={{
            title: track.trackName,
            artist: track.artistName,
            artworkSrc: track.artworkUrl100,
            url: playbackUrl,
          }}
        />
        <span>{fullUrl ? "Listen on SoundCloud" : "Listen to a preview"}</span>
      </div>
    ) : (
      <p className="opacity-60">No preview available for this track.</p>
    );
  };

  return (
    <Layout
      header={{
        title: track.trackName,
        titleVt: isSingle ? `album-${track.collectionId}` : undefined,
      }}
      accentColor={accentColor}
      leading={
        <div className="flex min-w-0 flex-col gap-3">
          <img
            {...vtName`${isSingle ? `album-artwork-${track.collectionId}` : undefined}`}
            src={getBigItunesArtwork(track)}
            alt={`${track.collectionName} album cover`}
            className="mx-auto aspect-square w-full max-w-72"
            width={600}
            height={600}
          />

          <Chip
            to="/$itunesId"
            params={{ itunesId: encodeItunesId(track.artistId) }}
          >
            {track.artistName}
          </Chip>

          <Await promise={soundcloud} fallback={playback()}>
            {(matches) =>
              playback(
                $soundcloud.trackUrl(
                  matches,
                  track.trackName,
                  track.artistName,
                ),
              )
            }
          </Await>

          <PlatformLinks links={trackLinks(track)} />
        </div>
      }
      trailing={
        <section
          aria-label="Track details"
          data-scroll-restoration-id={scrollRegions.content}
          className="flex min-w-0 flex-col gap-3 pb-32 lg:overflow-y-auto"
        >
          {!isSingle && (
            <>
              <h2 className="section-divider">from the album</h2>
              <Chip
                to="/$itunesId"
                params={{ itunesId: encodeItunesId(track.collectionId) }}
                leading={track.artworkUrl60}
                vt={{
                  title: `album-${track.collectionId}`,
                  img: `album-artwork-${track.collectionId}`,
                }}
              >
                {track.collectionName}
              </Chip>
            </>
          )}

          <h2>track details</h2>
          <dl>
            <dt>released</dt>
            <dd>
              {formatDate(new Date(track.releaseDate), {
                dateStyle: "long",
              })}
            </dd>
            {Number.isFinite(track.trackTimeMillis) && (
              <>
                <dt>duration</dt>
                <dd>{duration}</dd>
              </>
            )}
            <dt
              className="cursor-help"
              title="this genre comes from itunes and is often vague or non-specific"
            >
              genre
            </dt>
            <dd className="wrap-anywhere capitalize">
              {track.primaryGenreName}
            </dd>
            {!isSingle && (
              <>
                <dt>track</dt>
                <dd>
                  {track.trackNumber} of {track.trackCount}
                </dd>
              </>
            )}
            {track.discCount > 1 && (
              <>
                <dt>disc</dt>
                <dd>
                  {track.discNumber} of {track.discCount}
                </dd>
              </>
            )}
            {track.trackExplicitness === "explicit" && (
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
