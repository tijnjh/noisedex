import { Chip } from "#components/chip";
import { Detail } from "#components/detail";
import { GenreChip } from "#components/genre-chip";
import { ContentPane, Layout } from "#components/layout";
import { PreviewPlayButton } from "#components/play-button";
import { SpotifyWidget } from "#components/spotify-widget";
import { WikipediaDescription } from "#components/wikipedia-description";
import { usePopover } from "#hooks/use-popover";
import { $everynoise, $wikipedia } from "#lib/api/index";
import { findSoundOfPlaylistId } from "#lib/api/platforms/everynoise-data";
import { siteName } from "#lib/constants";
import { pageHead } from "#lib/head";
import { capitalizeWords } from "#lib/utils";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    if (!/^[a-z0-9]+$/.test(params.slug)) throw notFound();

    const genre = await $everynoise.getGenreBySlug(params.slug);
    if (!genre?.genreName) throw notFound();

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
  const playlistId = findSoundOfPlaylistId(genre.links ?? []);

  return (
    <Layout
      header={{ title: genre.genreName, titleClassName: "capitalize" }}
      accentColor={genre.style?.color}
      leading={
        <>
          {playlistId && <SpotifyWidget id={playlistId} type="playlist" />}

          <WikipediaDescription summary={genre.wikipediaGenre} />

          <span className="section-divider">related genres</span>

          <div className="cool-grid lg:mb-32">
            {genre.relatedGenres?.map((genre) => (
              <GenreChip key={genre.genreName} genre={genre} />
            ))}
          </div>
        </>
      }
      trailing={
        <ContentPane label="Artists in this genre">
          <h2 className="section-divider">artists in this genre</h2>

          <div className="mb-32 grid grid-cols-responsive gap-3">
            {genre.artists?.map((artist) => (
              <ArtistChip key={artist.id} artist={artist} />
            ))}
          </div>
        </ContentPane>
      }
    />
  );
}

function ArtistChip({ artist }: { artist: $everynoise.Artist }) {
  const triggerProps = usePopover(
    <dl>
      <Detail label="example track">{artist.preview.title}</Detail>
    </dl>,
  );

  return (
    <Chip
      {...triggerProps}
      // everynoise only knows spotify ids, so jump to the best itunes match for the name
      to="/search"
      search={{ q: artist.artistName, lucky: true }}
      trailing={<PreviewPlayButton preview={artist.preview} color={artist.style.color} />}
    >
      {artist.artistName}
    </Chip>
  );
}
