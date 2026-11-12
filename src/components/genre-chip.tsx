import { usePopover } from "#hooks/use-popover";
import { $everynoise } from "#lib/api/index";
import { genreNameToSlug, splitPreviewTitle } from "#lib/api/platforms/everynoise-data";
import { Chip } from "./chip";
import { PlayButton } from "./play-button";

export function GenreChip({ genre }: { genre: $everynoise.Genre }) {
  const previewTrack = splitPreviewTitle(genre.preview.title);

  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 p-3">
      <dl>
        <dt>{previewTrack?.artist}</dt>
        <dd>{previewTrack?.title}</dd>
      </dl>
    </div>,
  );

  return (
    <Chip
      {...triggerProps}
      className="capitalize"
      to="/genre/$slug"
      params={{ slug: genreNameToSlug(genre.genreName) }}
      trailing={
        <PlayButton
          title={genre.preview.title}
          className="btn size-9 shrink-0 justify-center"
          style={{ backgroundColor: genre.style.color }}
          track={{
            title: previewTrack?.title,
            artist: previewTrack?.artist,
            artworkSrc: undefined,
            url: genre.preview.url,
          }}
        />
      }
    >
      {genre.genreName}
    </Chip>
  );
}
