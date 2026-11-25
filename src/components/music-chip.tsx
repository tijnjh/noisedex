import { Chip } from "#components/chip";
import { TrackCard, useHoverPlayAction } from "#components/play-button";
import * as $itunes from "#lib/api/platforms/itunes";
import { encodeItunesId, trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { itunesPlayback, type PlaybackTrack } from "#lib/playback";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

export function MusicChip({
  music,
  showArtist = false,
}: {
  music: ResultAlbum | ResultMusicTrack;
  showArtist?: boolean;
}) {
  const track = music.wrapperType === "track" ? music : undefined;
  const title = track ? track.trackName : trimItunesCollectionPostfix(music.collectionName);

  const hoverProps = useHoverPlayAction(
    () => (track ? itunesPlayback(track) : loadFirstTrack(music.collectionId)),
    track ? undefined : (playing) => <TrackCard track={playing} note="track 1" />,
  );

  return (
    <Chip
      containerProps={hoverProps}
      artwork={music.artworkUrl60}
      vt={
        track
          ? undefined
          : {
              title: `album-${music.collectionId}`,
              img: `album-artwork-${music.collectionId}`,
            }
      }
      subtitle={showArtist ? music.artistName : undefined}
      to="/$itunesId"
      params={{
        itunesId: encodeItunesId(track?.trackId ?? music.collectionId),
      }}
    >
      {title}
    </Chip>
  );
}

const firstTracks = new Map<number, Promise<PlaybackTrack | undefined>>();

function loadFirstTrack(albumId: number) {
  let first = firstTracks.get(albumId);
  if (!first) {
    first = $itunes
      .getMusic(albumId)
      .then((music) =>
        music?.type === "album" && music.tracks[0] ? itunesPlayback(music.tracks[0]) : undefined,
      )
      .catch(() => undefined);
    firstTracks.set(albumId, first);
  }
  return first;
}
