import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { SpotifyWidget } from "#components/spotify-widget";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $everynoise, $wikipedia } from "#lib/api/index";
import {
  findSoundOfPlaylistId,
  genreNameToSlug,
} from "#lib/api/platforms/everynoise-data";
import { siteName, siteUrl } from "#lib/constants";
import { scrollRegions } from "#lib/scroll-regions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    const genre = await $everynoise.getGenreBySlug({ data: params.slug });

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
        title: `${loaderData?.genreName ?? params.slug} artists | ${siteName}`,
      },
      {
        name: "description",
        content: `Explore ${loaderData?.genreName ?? params.slug} artists and related music genres on ${siteName}.`,
      },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/genre/${params.slug}` }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const genre = Route.useLoaderData();
  const playlistId = findSoundOfPlaylistId(genre.links ?? []);

  return (
    <Layout
      header={{ title: genre.genreName ?? params.slug }}
      leading={
        <>
          {playlistId && <SpotifyWidget id={playlistId} type="playlist" />}

          <WikipediaDescription summary={genre.wikipediaGenre} />

          <span className="section-divider">related genres</span>

          <div className="cool-grid">
            {genre.relatedGenres?.map((genre) => (
              <Chip
                key={genre.genreName}
                to="/genre/$slug"
                params={{ slug: genreNameToSlug(genre.genreName) }}
                trailing={
                  <PlayButton
                    title={genre.previewTitle!}
                    className="btn size-9 shrink-0 justify-center"
                    style={{ backgroundColor: genre.color }}
                    track={{
                      title: genre.previewTitle ?? undefined,
                      url: genre.previewUrl ?? undefined,
                    }}
                  />
                }
              >
                {genre.genreName}
              </Chip>
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
              <Chip
                key={artist.id}
                to="/artist/$spotifyId"
                params={{ spotifyId: artist.id }}
                trailing={
                  <PlayButton
                    className="btn size-9 justify-center"
                    style={{ backgroundColor: artist.color }}
                    title={artist.previewTitle!}
                    track={{
                      title: artist.previewTitle ?? undefined,
                      url: artist.previewUrl ?? undefined,
                    }}
                  />
                }
              >
                {artist.artistName!}
              </Chip>
            ))}
          </div>
        </div>
      }
    />
  );
}
