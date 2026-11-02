import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlayButton } from "#components/play-button";
import { SpotifyWidget } from "#components/spotify-widget";
import { $everynoise } from "#lib/api/index";
import { siteName } from "#lib/constants";
import { genreSlug } from "#lib/genres";
import { pageHead } from "#lib/page-head";
import { createFileRoute, notFound } from "@tanstack/solid-router";
import { For, Show } from "solid-js";

export const Route = createFileRoute("/genre/$slug")({
  loader: async ({ params }) => {
    const genre = await $everynoise.getGenrePage({ data: params.slug });
    if (!genre) throw notFound();
    return genre;
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.name ?? params.slug;
    return pageHead({
      title: `${name} artists`,
      description: `Explore ${name} artists and related music genres on ${siteName}.`,
      path: `/genre/${params.slug}`,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const genre = Route.useLoaderData();

  return (
    <Layout
      header={{ title: genre().name }}
      leading={
        <>
          <Show when={genre().playlistId}>
            {(id) => <SpotifyWidget id={id()} type="playlist" />}
          </Show>

          <span class="section-divider">related genres</span>

          <div class="cool-grid">
            <For each={genre().related}>
              {(related) => (
                <Chip
                  to="/genre/$slug"
                  params={{ slug: genreSlug(related.name) }}
                  trailing={
                    <PlayButton
                      title={related.previewTitle}
                      class="bt size-9 shrink-0 justify-center"
                      style={{ "background-color": related.color }}
                      track={{
                        title: related.previewTitle,
                        url: related.previewUrl,
                      }}
                    />
                  }
                >
                  {related.name}
                </Chip>
              )}
            </For>
          </div>
        </>
      }
      trailing={
        <div class="flex flex-col gap-3 lg:overflow-y-auto">
          <span class="section-divider">artists in this genre</span>

          <div class="grid grid-cols-responsive gap-3">
            <For each={genre().artists}>
              {(artist) => (
                <Chip
                  to="/artist/$spotifyId"
                  params={{ spotifyId: artist.spotifyId }}
                  trailing={
                    <PlayButton
                      class="btn size-9 justify-center"
                      style={{ "background-color": artist.color }}
                      title={artist.previewTitle}
                      track={{
                        title: artist.previewTitle,
                        url: artist.previewUrl,
                      }}
                    />
                  }
                >
                  {artist.name}
                </Chip>
              )}
            </For>
          </div>
        </div>
      }
    />
  );
}
