import { Chip } from "#components/chip";
import { Detail } from "#components/detail";
import { usePopover } from "#hooks/use-popover";
import { encodeItunesId, trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { formatDate, formatMillis } from "#lib/utils";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

export function MusicChip({
  music,
  showArtist = false,
}: {
  music: ResultAlbum | ResultMusicTrack;
  showArtist?: boolean;
}) {
  const track = music.wrapperType === "track" ? music : undefined;
  const title = track?.trackName ?? music.collectionName;
  const date = new Date(music.releaseDate);

  const triggerProps = usePopover(
    <>
      {music.artworkUrl100 && <img className="size-36" src={music.artworkUrl100} alt="" />}
      {title}

      <dl>
        {music.artistName && <Detail label="artist">{music.artistName}</Detail>}
        {track && music.collectionName && <Detail label="album">{music.collectionName}</Detail>}
        {Number.isFinite(date.getTime()) && (
          <Detail label="release date">{formatDate(date)}</Detail>
        )}
        {music.primaryGenreName && (
          <Detail label="itunes genre" className="capitalize">
            {music.primaryGenreName}
          </Detail>
        )}
        {track && track.trackTimeMillis > 0 && (
          <Detail label="duration">{formatMillis(track.trackTimeMillis)}</Detail>
        )}
        {!track && music.trackCount > 0 && <Detail label="tracks">{music.trackCount}</Detail>}
      </dl>
    </>,
  );

  const label = track ? title : trimItunesCollectionPostfix(title);

  return (
    <Chip
      {...triggerProps}
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
