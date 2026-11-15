import { usePopover } from "#hooks/use-popover";
import { $everynoise } from "#lib/api/index";
import { genreNameToSlug, splitPreviewTitle } from "#lib/api/platforms/everynoise-data";
import { Chip } from "./chip";
import { Detail } from "./detail";
import { PreviewPlayButton } from "./play-button";

export function GenreChip({ genre }: { genre: $everynoise.Genre }) {
  const previewTrack = splitPreviewTitle(genre.preview.title);

  const triggerProps = usePopover(
    <dl>
      <Detail label={previewTrack?.artist}>{previewTrack?.title}</Detail>
    </dl>,
  );

  return (
    <Chip
      {...triggerProps}
      className="capitalize"
      to="/genre/$slug"
      params={{ slug: genreNameToSlug(genre.genreName) }}
      trailing={<PreviewPlayButton preview={genre.preview} color={genre.style.color} />}
    >
      {genre.genreName}
    </Chip>
  );
}
