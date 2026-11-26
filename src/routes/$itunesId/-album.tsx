import { ArtistChips } from "#components/artist-chips";
import { AsyncContent } from "#components/async-content";
import { Chip } from "#components/chip";
import { ContentPane, Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { TrackCard, useHoverPlayAction } from "#components/play-button";
import { WikipediaDescription } from "#components/wikipedia-description";
import * as $fantano from "#lib/api/platforms/fantano";
import { encodeItunesId, getBigItunesArtwork } from "#lib/api/platforms/itunes-data";
import * as $wikipedia from "#lib/api/platforms/wikipedia";
import { resolveArtistCredit } from "#lib/artist-credit";
import { getArtworkColors } from "#lib/artwork-color";
import { siteName } from "#lib/constants";
import { musicHead } from "#lib/head";
import { albumLinks } from "#lib/platform-links";
import { itunesPlayback } from "#lib/playback";
import { isoDuration } from "#lib/utils";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

type AlbumData = ReturnType<typeof loadAlbum>;

// unawaited promises stream in after the page
export function loadAlbum({ album, tracks }: { album: ResultAlbum; tracks: ResultMusicTrack[] }) {
  const { collectionName, artistName } = album;
  const colors = getArtworkColors({ data: album.artworkUrl100 }).catch(() => undefined);

  return {
    album,
    artists: resolveArtistCredit(album.artistName, album.artistId),
    tracks,
    wikipedia: $wikipedia.enrichWithGenres(
      $wikipedia.getAlbumByName({ data: { album: collectionName, artist: artistName } }),
    ),
    accentColor: colors.then((c) => c?.accent),
    backgroundColor: colors.then((c) => c?.background),
    middleColor: colors.then((c) => c?.middle),
    fantanoReview: $fantano.getReview({ data: { album: collectionName, artist: artistName } }),
  };
}

export function albumHead({ album, tracks }: AlbumData) {
  const artwork = getBigItunesArtwork(album);

  return musicHead({
    title: `${album.collectionName} by ${album.artistName}`,
    description: `Explore ${album.collectionName} by ${album.artistName}: release date, genre, and ${tracks.length} tracks with previews on ${siteName}.`,
    path: `/${encodeItunesId(album.collectionId)}`,
    artwork,
    type: "music.album",
    jsonLd: {
      "@type": "MusicAlbum",
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
        duration: isoDuration(track.trackTimeMillis),
      })),
    },
  });
}

export function AlbumPage({
  album,
  artists,
  tracks,
  wikipedia,
  accentColor,
  fantanoReview,
}: AlbumData) {
  return (
    <Layout
      title={album.collectionName}
      titleVt={`album-${album.collectionId}`}
      accentColor={accentColor}
      artwork={{
        src: getBigItunesArtwork(album),
        alt: `${album.collectionName} album cover`,
        vt: `album-artwork-${album.collectionId}`,
      }}
      leading={
        <div className="flex flex-col gap-3 lg:mb-32">
          <ArtistChips
            credit={album.artistName}
            artists={artists}
            vt={`artist-${album.artistId}`}
          />
          <p>
            released {new Date(album.releaseDate).toLocaleDateString("en", { dateStyle: "long" })}
          </p>

          <PlatformLinks links={albumLinks(album)} />
          <FantanoReview review={fantanoReview} />
          <WikipediaDescription {...wikipedia} />
        </div>
      }
      trailing={
        <ContentPane label="Track list" className="overflow-x-clip pb-32 lg:h-full">
          <h2 className="section-divider">tracks</h2>

          <div className="grid w-full grid-cols-[max-content_1fr] gap-3">
            {tracks.map((track) => (
              <Track key={track.trackId} track={track} />
            ))}
          </div>
        </ContentPane>
      }
    />
  );
}

function FantanoReview({ review }: { review: AlbumData["fantanoReview"] }) {
  return (
    <AsyncContent<{ excerpt: string | null; url: string } | undefined>
      promise={review}
      sample={{
        excerpt:
          "An album full of distinctive sounds and memorable moments, with plenty to discover across its tracks. Each listen reveals another detail in the music.",
        url: "https://theneedledrop.com/",
      }}
      label="Loading The Needle Drop review"
    >
      {(found) =>
        found?.excerpt ? (
          <figure className="mt-3 border-l-2 border-current/25 pl-4">
            <blockquote cite={found.url} className="inline italic">
              <p className="inline whitespace-pre-line">“{found.excerpt.trim()}”</p>
            </blockquote>
            <figcaption>
              <a
                href={found.url}
                target="_blank"
                rel="noreferrer"
                className="underline opacity-50 hover:opacity-100"
              >
                theneedledrop.com
              </a>
            </figcaption>
          </figure>
        ) : null
      }
    </AsyncContent>
  );
}

function Track({ track }: { track: ResultMusicTrack }) {
  const playback = itunesPlayback(track);
  const hoverProps = useHoverPlayAction(
    () => playback,
    (playing) => (
      <TrackCard track={playing} note={track.previewUrl ? "30 second preview" : undefined} />
    ),
  );

  return (
    <div {...hoverProps} className="col-span-full grid w-full grid-cols-subgrid">
      <div className="flex items-center justify-end">{track.trackNumber}</div>

      <Chip to="/$itunesId" params={{ itunesId: encodeItunesId(track.trackId) }}>
        {track.trackName}
      </Chip>
    </div>
  );
}
