import { AsyncContent } from "#components/async-content";
import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { WikipediaDescription } from "#components/wikipedia-description";
import { usePopover } from "#hooks/use-popover";
import { $fantano, $soundcloud, $wikipedia } from "#lib/api/index";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import {
  getBigItunesArtwork,
  trimItunesCollectionPostfix,
} from "#lib/api/platforms/itunes-data";
import { getArtworkColor } from "#lib/artwork-color";
import { siteName, siteUrl } from "#lib/constants";
import { musicMetadata } from "#lib/music-metadata";
import { albumLinks } from "#lib/platform-links";
import { scrollRegions } from "#lib/scroll-regions";
import { formatDate, formatMillis, vtName } from "#lib/utils";
import { Await } from "@tanstack/react-router";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

type AlbumData = ReturnType<typeof loadAlbum>;

export function loadAlbum({
  album,
  tracks,
}: {
  album: ResultAlbum;
  tracks: ResultMusicTrack[];
}) {
  const { summary: wikipediaAlbum, genres: wikipediaAlbumGenres } =
    $wikipedia.enrichWithGenres(
      $wikipedia.getAlbumByName({
        data: { album: album.collectionName, artist: album.artistName },
      }),
    );

  const soundcloud = $soundcloud
    .matchAlbum({
      data: {
        artist: album.artistName,
        album: trimItunesCollectionPostfix(album.collectionName),
      },
    })
    .catch(() => []);
  const accentColor = getArtworkColor({ data: album.artworkUrl100 }).catch(
    () => undefined,
  );

  const fantanoReview = $fantano.getReview({
    data: {
      album: album.collectionName,
      artist: album.artistName,
    },
  });

  return {
    album,
    tracks,
    soundcloud,
    accentColor,
    wikipediaAlbum,
    wikipediaAlbumGenres,
    fantanoReview,
  };
}

export function albumHead(data: AlbumData) {
  const { album, tracks } = data;

  const title = `${album.collectionName} by ${album.artistName} | ${siteName}`;
  const description = `Explore ${album.collectionName} by ${album.artistName}: release date, genre, and ${tracks.length} tracks with previews on ${siteName}.`;
  const url = `${siteUrl}/${encodeItunesId(album.collectionId)}`;
  const artwork = getBigItunesArtwork(album);

  return musicMetadata({
    title,
    description,
    url,
    artwork,
    type: "music.album",
    recording: {
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
        duration: `PT${Math.round(track.trackTimeMillis / 1000)}S`,
      })),
    },
  });
}

export function AlbumPage({ data }: { data: AlbumData }) {
  return (
    <Layout
      header={{
        title: data.album.collectionName,
        titleVt: `album-${data.album.collectionId}`,
      }}
      accentColor={data.accentColor}
      leading={
        <div className="flex flex-col gap-3">
          <img
            {...vtName`album-artwork-${data.album.collectionId}`}
            src={getBigItunesArtwork(data.album)}
            alt={`${data.album.collectionName} album cover`}
            className="mx-auto aspect-square w-full max-w-72"
          />

          <Chip
            vt={{ title: `artist-${data.album.artistId}` }}
            to="/$itunesId"
            params={{ itunesId: encodeItunesId(data.album.artistId) }}
          >
            {data.album.artistName}
          </Chip>
          <p>
            released{" "}
            {formatDate(new Date(data.album.releaseDate), {
              dateStyle: "long",
            })}
          </p>

          <PlatformLinks links={albumLinks(data.album)} />

          <AsyncContent<{ excerpt: string; url: string } | undefined>
            promise={data.fantanoReview}
            sample={{
              excerpt:
                "An album full of distinctive sounds and memorable moments, with plenty to discover across its tracks. Each listen reveals another detail in the music.",
              url: "https://theneedledrop.com/",
            }}
            label="Loading The Needle Drop review"
          >
            {(review) =>
              review?.excerpt ? (
                <figure className="mt-3 border-l-2 border-current/25 pl-4">
                  <blockquote cite={review.url} className="inline italic">
                    <p className="inline whitespace-pre-line">
                      “{review.excerpt.trim()}”
                    </p>
                  </blockquote>{" "}
                  <figcaption className="ml-2 inline">
                    <span aria-hidden="true" className="mr-2 opacity-50">
                      -
                    </span>
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline opacity-50 hover:opacity-100"
                    >
                      the needle drop
                    </a>
                  </figcaption>
                </figure>
              ) : null
            }
          </AsyncContent>

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
          className="flex h-full flex-col gap-3 overflow-x-hidden overflow-y-auto pb-32"
        >
          <h2 className="text-xl font-semibold">tracks</h2>

          <div className="grid w-full grid-cols-[max-content_1fr] gap-3">
            {data.tracks.map((track) => (
              <Track
                key={track.trackId}
                track={track}
                soundcloud={data.soundcloud}
              />
            ))}
          </div>
        </section>
      }
    />
  );
}

function Track({
  track,
  soundcloud,
}: {
  track: ResultMusicTrack;
  soundcloud: ReturnType<typeof $soundcloud.matchAlbum>;
}) {
  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 p-3">
      <dl>
        <dt>duration</dt>
        <dd>{formatMillis(track.trackTimeMillis)}</dd>
      </dl>
    </div>,
  );

  const playButton = (url: string) => (
    <PlayButton
      className="btn-inverse size-9 shrink-0 justify-center"
      track={{
        title: track.trackName,
        artist: track.artistName,
        artworkSrc: track.artworkUrl100,
        url,
      }}
    />
  );

  return (
    <div
      {...triggerProps}
      key={track.trackId}
      className="col-span-full grid w-full grid-cols-subgrid"
    >
      <div className="flex items-center justify-end">{track.trackNumber}</div>

      <Chip
        to={"/$itunesId"}
        params={{ itunesId: encodeItunesId(track.trackId) }}
        trailing={
          <Await promise={soundcloud} fallback={playButton(track.previewUrl)}>
            {(matches) =>
              playButton(
                $soundcloud.trackUrl(
                  matches,
                  track.trackName,
                  track.artistName,
                ) ?? track.previewUrl,
              )
            }
          </Await>
        }
      >
        {track.trackName}
      </Chip>
    </div>
  );
}
