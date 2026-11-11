import { Chip } from "#components/chip";
import { usePopover } from "#hooks/use-popover";
import {
  encodeItunesId,
  trimItunesCollectionPostfix,
} from "#lib/api/platforms/itunes-data";
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
    <div className="flex w-72 flex-col gap-3 p-3 wrap-break-word">
      {music.artworkUrl100 && (
        <img className="size-36" src={music.artworkUrl100} alt="" />
      )}
      {title}

      <dl>
        {music.artistName && (
          <>
            <dt>artist</dt>
            <dd>{music.artistName}</dd>
          </>
        )}
        {track && music.collectionName && (
          <>
            <dt>album</dt>
            <dd>{music.collectionName}</dd>
          </>
        )}
        {Number.isFinite(date.getTime()) && (
          <>
            <dt>release date</dt>
            <dd>{formatDate(date)}</dd>
          </>
        )}
        {music.primaryGenreName && (
          <>
            <dt>itunes genre</dt>
            <dd>{music.primaryGenreName}</dd>
          </>
        )}
        {track && track.trackTimeMillis > 0 && (
          <>
            <dt>duration</dt>
            <dd>{formatMillis(track.trackTimeMillis)}</dd>
          </>
        )}
        {!track && music.trackCount > 0 && (
          <>
            <dt>tracks</dt>
            <dd>{music.trackCount}</dd>
          </>
        )}
      </dl>
    </div>,
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
      to={track ? "/track/$itunesId" : "/album/$itunesId"}
      params={{
        itunesId: encodeItunesId(track?.trackId ?? music.collectionId),
      }}
    >
      {showArtist ? `${label} — ${music.artistName}` : label}
    </Chip>
  );
}
