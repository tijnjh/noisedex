import { Chip } from "#components/chip";
import { TrackCard } from "#components/play-button";
// import { Detail } from "#components/detail";
// import { usePopover } from "#hooks/use-popover";
import { encodeItunesId, trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { useHoverPlayAction } from "#lib/hover-play-action";
import { itunesPlayback, type PlaybackTrack } from "#lib/playback";
import { storeCountryFromLanguages } from "#lib/store-country";
// import { formatDate, formatMillis } from "#lib/utils";
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
  // const date = new Date(music.releaseDate);

  // const triggerProps = usePopover(
  //   <>
  //     {music.artworkUrl100 && <img className="size-36" src={music.artworkUrl100} alt="" />}
  //     {title}

  //     <dl>
  //       {music.artistName && <Detail label="artist">{music.artistName}</Detail>}
  //       {track && music.collectionName && <Detail label="album">{music.collectionName}</Detail>}
  //       {Number.isFinite(date.getTime()) && (
  //         <Detail label="release date">{formatDate(date)}</Detail>
  //       )}
  //       {music.primaryGenreName && (
  //         <Detail label="itunes genre" className="capitalize">
  //           {music.primaryGenreName}
  //         </Detail>
  //       )}
  //       {track && track.trackTimeMillis > 0 && (
  //         <Detail label="duration">{formatMillis(track.trackTimeMillis)}</Detail>
  //       )}
  //       {!track && music.trackCount > 0 && <Detail label="tracks">{music.trackCount}</Detail>}
  //     </dl>
  //   </>,
  // );

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
