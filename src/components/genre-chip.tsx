import { genreNameToSlug, type Genre } from "#lib/api/platforms/everynoise-data";
import { previewPlayback } from "#lib/playback";
import { Chip } from "./chip";
import { PlayButton, TrackCard, useHoverPlayAction } from "./play-button";

export function GenreChip({ genre }: { genre: Genre }) {
  const track = previewPlayback(genre.preview);
  const hoverProps = useHoverPlayAction(
    () => track,
    <TrackCard track={track} note="example track" />,
  );

  return (
    <Chip
      containerProps={hoverProps}
      className="lowercase"
      to="/genre/$slug"
      params={{ slug: genreNameToSlug(genre.genreName) }}
      trailing={<PlayButton track={track} color={genre.style.color} />}
    >
      {genre.genreName}
    </Chip>
  );
}
