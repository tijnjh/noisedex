import { usePopover } from "#hooks/use-popover";
import {
  Genre,
  genreNameToSlug,
  splitPreviewTitle,
} from "#lib/api/platforms/everynoise-data";
import { Chip } from "./chip";
import { PlayButton } from "./play-button";

export function GenreChip({ genre }: { genre: Genre }) {
  const previewTrack = splitPreviewTitle(genre.previewTitle);

  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 border p-3">
      <dl>
        <dt>{previewTrack?.artist}</dt>
        <dd>{previewTrack?.title}</dd>
      </dl>
    </div>,
  );

  return (
    <Chip
      {...triggerProps}
      to="/genre/$slug"
      params={{ slug: genreNameToSlug(genre.genreName) }}
      trailing={
        <PlayButton
          title={genre.previewTitle}
          className="btn size-9 shrink-0 justify-center"
          style={{ backgroundColor: genre.color }}
          track={{
            title: previewTrack?.title,
            artist: previewTrack?.artist,
            artworkSrc: undefined,
            url: genre.previewUrl,
          }}
        />
      }
    >
      {genre.genreName}
    </Chip>
  );
}
