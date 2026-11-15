import { Chip } from "#components/chip";
import { Detail } from "#components/detail";
import { ContentPane, Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { TrackPlayButton } from "#components/play-button";
import { $soundcloud } from "#lib/api/index";
import {
  encodeItunesId,
  getBigItunesArtwork,
  isSingleRelease,
  trimItunesCollectionPostfix,
} from "#lib/api/platforms/itunes-data";
import { getArtworkColor } from "#lib/artwork-color";
import { siteName } from "#lib/constants";
import { absoluteUrl, musicHead } from "#lib/head";
import { trackLinks } from "#lib/platform-links";
import { formatDate, formatMillis, isoDuration } from "#lib/utils";
import { Await } from "@tanstack/react-router";
import type { ResultMusicTrack } from "itunes-store-api";

type TrackData = ReturnType<typeof loadTrack>;

// everything beyond the itunes data is left as a promise, so it streams in after the page
export function loadTrack({ track }: { track: ResultMusicTrack }) {
  return {
    track,
    soundcloud: $soundcloud
      .matchAlbum({
        data: {
          artist: track.artistName,
          album: trimItunesCollectionPostfix(track.collectionName),
        },
      })
      .catch(() => []),
    accentColor: getArtworkColor({ data: track.artworkUrl100 }).catch(() => undefined),
  };
}

export function trackHead({ track }: TrackData) {
  const artwork = getBigItunesArtwork(track);

  return musicHead({
    title: `${track.trackName} by ${track.artistName}`,
    description: `Explore ${track.trackName} by ${track.artistName} from ${track.collectionName}: release date, genre, and listening links on ${siteName}.`,
    path: `/${encodeItunesId(track.trackId)}`,
    artwork,
    type: "music.song",
    jsonLd: {
      "@type": "MusicRecording",
      name: track.trackName,
      byArtist: { "@type": "MusicGroup", name: track.artistName },
      inAlbum: {
        "@type": "MusicAlbum",
        name: track.collectionName,
        url: absoluteUrl(`/${encodeItunesId(track.collectionId)}`),
      },
      datePublished: track.releaseDate,
      genre: track.primaryGenreName,
      image: artwork,
      duration: isoDuration(track.trackTimeMillis),
    },
  });
}

export function TrackPage({ track, soundcloud, accentColor }: TrackData) {
  // a single has no album page of its own, so its track page stands in for it
  const isSingle = isSingleRelease(track.collectionName, track.trackCount);

  return (
    <Layout
      header={{
        title: track.trackName,
        titleVt: isSingle ? `album-${track.collectionId}` : undefined,
      }}
      accentColor={accentColor}
      artwork={{
        src: getBigItunesArtwork(track),
        alt: `${track.collectionName} album cover`,
        vt: isSingle ? `album-artwork-${track.collectionId}` : undefined,
      }}
      leading={
        <div className="flex min-w-0 flex-col gap-3 lg:mb-32">
          <Chip to="/$itunesId" params={{ itunesId: encodeItunesId(track.artistId) }}>
            {track.artistName}
          </Chip>

          <Await promise={soundcloud} fallback={<Playback track={track} />}>
            {(matches) => (
              <Playback
                track={track}
                fullUrl={$soundcloud.trackUrl(matches, track.trackName, track.artistName)}
              />
            )}
          </Await>

          <PlatformLinks links={trackLinks(track)} />
        </div>
      }
      trailing={
        <ContentPane label="Track details" className="pb-32">
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
            <Detail label="released">
              {formatDate(new Date(track.releaseDate), { dateStyle: "long" })}
            </Detail>
            {Number.isFinite(track.trackTimeMillis) && (
              <Detail label="duration">{formatMillis(track.trackTimeMillis)}</Detail>
            )}
            <Detail
              label={
                <span
                  className="cursor-help"
                  title="this genre comes from itunes and is often vague or non-specific"
                >
                  genre
                </span>
              }
              className="wrap-anywhere capitalize"
            >
              {track.primaryGenreName}
            </Detail>
            {!isSingle && (
              <Detail label="track">
                {track.trackNumber} of {track.trackCount}
              </Detail>
            )}
            {track.discCount > 1 && (
              <Detail label="disc">
                {track.discNumber} of {track.discCount}
              </Detail>
            )}
            {track.trackExplicitness === "explicit" && <Detail label="content">explicit</Detail>}
          </dl>
        </ContentPane>
      }
    />
  );
}

function Playback({ track, fullUrl }: { track: ResultMusicTrack; fullUrl?: string }) {
  if (!fullUrl && !track.previewUrl) {
    return <p className="opacity-60">No preview available for this track.</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <TrackPlayButton track={track} url={fullUrl} />
      <span>{fullUrl ? "Listen on SoundCloud" : "Listen to a preview"}</span>
    </div>
  );
}
