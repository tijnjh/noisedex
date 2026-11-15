import { $everynoise } from "#lib/api/index";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { useHoverPlayAction } from "#lib/hover-play-action";
import { previewPlayback } from "#lib/playback";
import { Chip } from "./chip";
import { PreviewPlayButton, TrackCard } from "./play-button";

export function GenreChip({ genre }: { genre: $everynoise.Genre }) {
  const track = previewPlayback(genre.preview);
  const hoverProps = useHoverPlayAction(
    () => track,
    <TrackCard track={track} note="example track" />,
  );

  return (
    <Chip
      containerProps={hoverProps}
      className="capitalize"
      to="/genre/$slug"
      params={{ slug: genreNameToSlug(genre.genreName) }}
      trailing={<PreviewPlayButton preview={genre.preview} color={genre.style.color} />}
    >
      {genre.genreName}
    </Chip>
  );
}
