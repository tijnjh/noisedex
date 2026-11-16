import { Chip } from "#components/chip";
import { GenreChip } from "#components/genre-chip";
import { ContentPane, Layout } from "#components/layout";
import { PreviewPlayButton, TrackCard } from "#components/play-button";
import { SpotifyWidget } from "#components/spotify-widget";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $everynoise, $wikipedia } from "#lib/api/index";
import { findSoundOfPlaylistId } from "#lib/api/platforms/everynoise-data";
import { siteName } from "#lib/constants";
import { pageHead } from "#lib/head";
import { useHoverPlayAction } from "#lib/hover-play-action";
import { previewPlayback } from "#lib/playback";
import { capitalizeWords } from "#lib/utils";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    if (!/^[a-z0-9]+$/.test(params.slug)) throw notFound();

    const genre = await $everynoise.getGenreBySlug({ data: params.slug });

    // wikipedia often says "folk music" where everynoise just has "folk"
    if (!genre && params.slug.endsWith("music")) {
      throw redirect({ to: "/genre/$slug", params: { slug: params.slug.slice(0, -5) } });
    }
    if (!genre) throw notFound();

    return {
      ...genre,
      wikipediaGenre: $wikipedia.getGenreByName({ data: genre.genreName }).catch(() => null),
    };
  },
  head: ({ loaderData, params }) =>
    pageHead({
      title: `${capitalizeWords(loaderData?.genreName ?? "Genre")} artists`,
      description: `Explore ${loaderData?.genreName ?? "this genre"} artists and related music genres on ${siteName}.`,
      path: `/genre/${params.slug}`,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const genre = Route.useLoaderData();
  const playlistId = findSoundOfPlaylistId(genre.links);

  return (
    <Layout
      header={{ title: genre.genreName, titleClassName: "capitalize" }}
      accentColor={genre.style?.color}
      playback={genre.preview && { track: previewPlayback(genre.preview), note: "example track" }}
      leading={
        <>
          {playlistId && <SpotifyWidget id={playlistId} type="playlist" />}

          <WikipediaDescription summary={genre.wikipediaGenre} />

          <span className="section-divider">related genres</span>

          <div className="cool-grid lg:mb-32">
            {genre.relatedGenres.map((genre) => (
              <GenreChip key={genre.genreName} genre={genre} />
            ))}
          </div>
        </>
      }
      trailing={
        <ContentPane label="Artists in this genre">
          <h2 className="section-divider">artists in this genre</h2>

          <div className="mb-32 grid grid-cols-responsive gap-3">
            {genre.artists.map((artist) => (
              <ArtistChip key={artist.id} artist={artist} />
            ))}
          </div>
        </ContentPane>
      }
    />
  );
}

function ArtistChip({ artist }: { artist: $everynoise.Artist }) {
  const track = previewPlayback(artist.preview);
  const hoverProps = useHoverPlayAction(
    () => track,
    <TrackCard track={track} note="example track" />,
  );

  return (
    <Chip
      containerProps={hoverProps}
      // everynoise only knows spotify ids, so jump to the best itunes match for the name
      to="/search"
      search={{ q: artist.artistName, lucky: true }}
      trailing={<PreviewPlayButton preview={artist.preview} color={artist.style.color} />}
    >
      {artist.artistName}
    </Chip>
  );
}
