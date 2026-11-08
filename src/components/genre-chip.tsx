import { usePopover } from "#hooks/use-popover";
import { Genre, genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { Chip } from "./chip";
import { PlayButton } from "./play-button";

export function GenreChip({ genre }: { genre: Genre }) {
  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 border p-3">
      <dl>
        <dt>example track</dt>
        <dd>{genre.previewTitle}</dd>
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
          track={{ title: genre.previewTitle, url: genre.previewUrl }}
        />
      }
    >
      {genre.genreName}
    </Chip>
  );
}
