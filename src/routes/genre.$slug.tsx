import { Chip } from "#components/chip";
import { GenreChip } from "#components/genre-chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { SpotifyWidget } from "#components/spotify-widget";
import { WikipediaDescription } from "#components/wikipedia-description";
import { usePopover } from "#hooks/use-popover";
import { $everynoise, $wikipedia } from "#lib/api/index";
import { findSoundOfPlaylistId, splitPreviewTitle } from "#lib/api/platforms/everynoise-data";
import { siteName, siteUrl } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { capitalizeWords } from "#lib/utils";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    if (!/^[a-z0-9]+$/.test(params.slug)) throw notFound();

    const genre = await $everynoise.getGenreBySlug(params.slug);
    if (!genre?.genreName) throw notFound();

    const wikipediaGenre = genre.genreName
      ? $wikipedia.getGenreByName({ data: genre.genreName }).catch(() => null)
      : Promise.resolve(null);

    return {
      ...genre,
      wikipediaGenre,
    };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: `${capitalizeWords(loaderData?.genreName ?? "Genre")} artists • ${siteName}`,
      },
      {
        name: "description",
        content: `Explore ${loaderData?.genreName ?? "this genre"} artists and related music genres on ${siteName}.`,
      },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/genre/${params.slug}` }],
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

          <div className="cool-grid">
            {genre.relatedGenres?.map((genre) => (
              <GenreChip key={genre.genreName} genre={genre} />
            ))}
          </div>
        </>
      }
      trailing={
        <div
          data-scroll-restoration-id={scrollRegions.content}
          className="flex flex-col gap-3 lg:overflow-y-auto"
        >
          <span className="section-divider">artists in this genre</span>

          <div className="grid grid-cols-responsive gap-3">
            {genre.artists?.map((artist) => (
              <ArtistChip key={artist.id} artist={artist} />
            ))}
          </div>
        </div>
      }
    />
  );
}

function ArtistChip({ artist }: { artist: $everynoise.Artist }) {
  const triggerProps = usePopover(
    <div className="flex w-72 flex-col gap-3 p-3">
      <dl>
        <dt>example track</dt>
        <dd>{artist.preview.title}</dd>
      </dl>
    </div>,
  );

  const previewTrack = splitPreviewTitle(artist.preview.title);

  return (
    <Chip
      {...triggerProps}
      key={artist.id}
      to="/search"
      search={{ q: artist.artistName, lucky: true }}
      trailing={
        <PlayButton
          className="btn size-9 justify-center"
          style={{ backgroundColor: artist.style.color }}
          title={previewTrack?.title}
          track={{
            title: previewTrack?.title,
            artist: previewTrack?.artist,
            url: artist.preview.url,
            artworkSrc: undefined,
          }}
        />
      }
    >
      {artist.artistName!}
    </Chip>
  );
}
