import { Chip } from "#components/chip";
import { TrackCard } from "#components/play-button";
import { encodeItunesId, trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { useHoverPlayAction } from "#lib/hover-play-action";
import { itunesPlayback, type PlaybackTrack } from "#lib/playback";
import { storeCountryFromLanguages } from "#lib/store-country";
import { lookup, type ResultAlbum, type ResultMusicTrack } from "itunes-store-api";

export function MusicChip({
  music,
  showArtist = false,
}: {
  music: ResultAlbum | ResultMusicTrack;
  showArtist?: boolean;
}) {
  const track = music.wrapperType === "track" ? music : undefined;
  const title = track?.trackName ?? music.collectionName;

  const hoverProps = useHoverPlayAction(
    () => (track ? itunesPlayback(track) : loadFirstTrack(music.collectionId)),
    track ? undefined : (playing) => <TrackCard track={playing} note="track 1" />,
  );

  const label = track ? title : trimItunesCollectionPostfix(title);

  return (
    <Chip
      containerProps={hoverProps}
      leading={music.artworkUrl60}
      vt={
        track
          ? undefined
          : {
              title: `album-${music.collectionId}`,
              img: `album-artwork-${music.collectionId}`,
            }
      }
      to="/$itunesId"
      params={{
        itunesId: encodeItunesId(track?.trackId ?? music.collectionId),
      }}
    >
      {showArtist ? `${label} — ${music.artistName}` : label}
    </Chip>
  );
}

const firstTracks = new Map<number, Promise<PlaybackTrack | undefined>>();

function loadFirstTrack(albumId: number) {
  let first = firstTracks.get(albumId);
  if (!first) {
    first = lookup("id", albumId, {
      entity: "song",
      country: storeCountryFromLanguages(navigator.languages.join(",")),
    })
      .then(({ results }) => {
        const track = results.find((result) => result.wrapperType === "track");
        return track && itunesPlayback(track as ResultMusicTrack);
      })
      .catch(() => undefined);
    firstTracks.set(albumId, first);
  }
  return first;
}
