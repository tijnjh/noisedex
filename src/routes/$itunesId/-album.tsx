import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { WikipediaDescription } from "#components/wikipedia-description";
import { usePopover } from "#hooks/use-popover";
import { $soundcloud, $wikipedia } from "#lib/api/index";
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

  return {
    album,
    tracks,
    soundcloud,
    accentColor,
    wikipediaAlbum,
    wikipediaAlbumGenres,
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
          <p
            className="cursor-help"
            title="this genre comes from itunes and is often vague or non-specific"
          >
            genre: {data.album.primaryGenreName}
          </p>

          <PlatformLinks links={albumLinks(data.album)} />
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
          <h2 className="text-xl font-semibold">Tracks</h2>

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
