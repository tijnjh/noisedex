import { Chip } from "#components/chip";
import { GenreChip } from "#components/genre-chip";
import { ContentPane, Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { TrackCard, useHoverPlayAction } from "#components/play-button";
import { StatusPage } from "#components/status-page";
import { WikipediaDescription } from "#components/wikipedia-description";
import * as $everynoise from "#lib/api/platforms/everynoise";
import type { Artist, Genre } from "#lib/api/platforms/everynoise-data";
import * as $wikipedia from "#lib/api/platforms/wikipedia";
import { siteName } from "#lib/constants";
import { pageHead } from "#lib/head";
import { genreLinks } from "#lib/platform-links";
import { previewPlayback } from "#lib/playback";
import { capitalizeWords } from "#lib/utils";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    if (!/^[a-z0-9]+$/.test(params.slug)) throw await genreNotFound(params.slug);

    const genre = await $everynoise.getGenreBySlug({ data: params.slug });

    // wikipedia often says "folk music" where everynoise just has "folk"
    if (!genre && params.slug.endsWith("music")) {
      throw redirect({ to: "/genre/$slug", params: { slug: params.slug.slice(0, -5) } });
    }
    if (!genre) throw await genreNotFound(params.slug);

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
  notFoundComponent: ({ data }) => <GenreNotFound suggestions={data as Genre[]} />,
});

async function genreNotFound(slug: string) {
  const query = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return notFound({ data: await $everynoise.findSimilarGenres({ data: query }) });
}

function GenreNotFound({ suggestions }: { suggestions: Genre[] }) {
  return (
    <StatusPage
      code="404"
      title="genre not found"
      extra={
        suggestions.length > 0 && (
          <section className="flex w-full flex-col gap-3">
            <h2 className="section-divider">did you mean one of these?</h2>
            {suggestions.map((genre) => (
              <GenreChip key={genre.genreName} genre={genre} />
            ))}
          </section>
        )
      }
    >
      <p>there's no genre at this address. try searching for it instead.</p>
    </StatusPage>
  );
}

function RouteComponent() {
  const genre = Route.useLoaderData();

  return (
    <Layout
      title={genre.genreName}
      titleClassName="capitalize"
      accentColor={genre.style?.color}
      playback={genre.preview && { track: previewPlayback(genre.preview), note: "example track" }}
      leading={
        <>
          <PlatformLinks links={genreLinks(genre.links)} />

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

function ArtistChip({ artist }: { artist: Artist }) {
  const track = previewPlayback(artist.preview);
  const hoverProps = useHoverPlayAction(() => track, <TrackCard track={track} />);

  return (
    <Chip
      containerProps={hoverProps}
      color={artist.style.color}
      // everynoise only knows spotify ids, so jump to the best itunes match for the name
      to="/search"
      search={{ q: artist.artistName, lucky: true }}
    >
      {artist.artistName}
    </Chip>
  );
}
