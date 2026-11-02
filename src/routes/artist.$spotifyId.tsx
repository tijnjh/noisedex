import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { SpotifyWidget } from "#components/spotify-widget";
import { $spotify } from "#lib/api/index";
import { siteName } from "#lib/constants";
import { genreSlug } from "#lib/genres";
import { pageHead } from "#lib/page-head";
import type { ArtistReleases } from "#lib/releases";
import { createFileRoute } from "@tanstack/solid-router";
import { For, Show } from "solid-js";

export const Route = createFileRoute("/artist/$spotifyId")({
  loader: ({ params }) => $spotify.getArtist({ data: params.spotifyId }),
  head: ({ loaderData, params }) =>
    pageHead({
      title: `${loaderData?.name ?? "Artist"} albums`,
      description: `Browse albums and music genres for ${loaderData?.name ?? "this artist"} on ${siteName}.`,
      path: `/artist/${params.spotifyId}`,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const artist = Route.useLoaderData();

  return (
    <Layout
      header={{ title: artist().name }}
      leading={
        <>
          <SpotifyWidget id={artist().spotifyId} type="artist" class="h-38!" />

          <PlatformLinks
            for={{
              kind: "artist",
              name: artist().name,
              spotifyId: artist().spotifyId,
              itunesArtistId: artist().itunes?.itunesArtistId,
            }}
          />

          <Show when={artist().genres.length}>
            <span class="section-divider">genres this artist is in</span>

            <div class="cool-grid">
              <For each={artist().genres}>
                {(genre) => (
                  <Chip to="/genre/$slug" params={{ slug: genreSlug(genre) }}>
                    {genre}
                  </Chip>
                )}
              </For>
            </div>
          </Show>
        </>
      }
      trailing={
        <Show
          when={artist().itunes}
          fallback={<p class="opacity-60">No releases found on iTunes.</p>}
        >
          {(releases) => <ArtistReleasesList releases={releases()} />}
        </Show>
      }
    />
  );
}

function ArtistReleasesList(props: { releases: ArtistReleases }) {
  const sections = () =>
    [
      ["albums", props.releases.albums],
      ["eps", props.releases.eps],
      ["singles", props.releases.singles],
    ] as const;

  return (
    <div class="lg:overflow-y-auto">
      <For each={sections()}>
        {([name, releases]) => (
          <Show when={releases.length}>
            <div class="flex flex-col gap-3">
              <span class="section-divider">{name}</span>

              <div class="cool-grid">
                <For each={releases}>
                  {(release) => (
                    <Chip
                      leading={release.thumbnailUrl}
                      to="/album/$itunesId"
                      params={{ itunesId: String(release.id) }}
                    >
                      {release.title}
                    </Chip>
                  )}
                </For>
              </div>
            </div>
          </Show>
        )}
      </For>
    </div>
  );
}
