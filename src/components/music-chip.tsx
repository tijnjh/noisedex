import { Chip } from "#components/chip";
import { usePopover } from "#hooks/use-popover";
import {
  formatReleaseDate,
  spotifyReleaseType,
  type SpotifyAlbum,
  type SpotifyTrack,
} from "#lib/api/platforms/spotify-data";
import { formatMillis } from "#lib/utils";

export function MusicChip({
  music,
  showArtist = false,
  showReleaseType = false,
}: {
  music: SpotifyAlbum | SpotifyTrack;
  showArtist?: boolean;
  showReleaseType?: boolean;
}) {
  const track = "album" in music ? music : undefined;
  const album = "album" in music ? music.album : music;
  const artistName = music.artists.map((artist) => artist.name).join(", ");
  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 border p-3 wrap-break-word">
      {album.images[0] && (
        <img className="size-36" src={album.images[0].url} alt="" />
      )}
      {music.name}
      <dl>
        <dt>artist</dt>
        <dd>{artistName}</dd>
        {track && (
          <>
            <dt>album</dt>
            <dd>{album.name}</dd>
          </>
        )}
        <dt>release date</dt>
        <dd>{formatReleaseDate(album.release_date)}</dd>
        {track ? (
          <>
            <dt>duration</dt>
            <dd>{formatMillis(track.duration_ms)}</dd>
          </>
        ) : (
          <>
            <dt>tracks</dt>
            <dd>{album.total_tracks}</dd>
          </>
        )}
      </dl>
    </div>,
  );
  return (
    <Chip
      {...triggerProps}
      leading={album.images.at(-1)?.url}
      trailing={
        showReleaseType && !track ? (
          <span className="flex h-control shrink-0 items-center justify-center bg-zinc-50-950 px-3 text-xs">
            {spotifyReleaseType(album)}
          </span>
        ) : undefined
      }
      to={track ? "/track/spotify/$spotifyId" : "/album/spotify/$spotifyId"}
      params={{ spotifyId: music.id }}
    >
      {showArtist ? `${music.name} — ${artistName}` : music.name}
    </Chip>
  );
}
