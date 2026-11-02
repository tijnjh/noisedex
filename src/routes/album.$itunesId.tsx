import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $itunes } from "#lib/api/index";
import { albumHead } from "#lib/page-head";
import { fmt } from "#lib/utils";
import { createFileRoute, notFound, useRouter } from "@tanstack/solid-router";
import { For } from "solid-js";

export const Route = createFileRoute("/album/$itunesId")({
  loader: async ({ params }) => {
    const albumWithTracks = await $itunes.releases.getAlbum(params.itunesId);
    if (!albumWithTracks) throw notFound();
    return albumWithTracks;
  },
  head: ({ loaderData }) =>
    loaderData ? albumHead(loaderData.album, loaderData.tracks) : {},
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const album = () => data().album;

  const backHref = () =>
    router.buildLocation({
      to: "/search",
      search: { lucky: true, q: album().artistName },
    }).href;

  return (
    <Layout
      header={{ title: album().name, backHref: backHref() }}
      leading={
        <div class="flex flex-col gap-3">
          <img
            src={album().artworkUrl}
            alt={`${album().name} album cover`}
            class="mx-auto aspect-square w-full max-w-72"
          />

          <Chip to="/search" search={{ lucky: true, q: album().artistName }}>
            {album().artistName}
          </Chip>
          <p>
            released{" "}
            {fmt("date", new Date(album().releaseDate), {
              dateStyle: "long",
            })}
          </p>
          <p
            class="cursor-help"
            title="this genre comes from itunes and is often vague or non-specific"
          >
            genre: {album().genre}
          </p>

          <PlatformLinks
            for={{
              kind: "album",
              artistName: album().artistName,
              title: album().title,
              appleMusicUrl: album().appleMusicUrl,
            }}
          />
        </div>
      }
      trailing={
        <section
          aria-label="Track list"
          class="flex h-full flex-col gap-3 overflow-x-hidden overflow-y-auto pb-32"
        >
          <h2 class="text-xl font-semibold">Tracks</h2>
          <For each={data().tracks}>
            {(track) => (
              <Chip
                to={"/track/$itunesId"}
                params={{ itunesId: String(track.id) }}
                trailing={
                  <PlayButton
                    class="btn-inverse size-9 shrink-0 justify-center"
                    track={{ title: track.title, url: track.previewUrl }}
                  />
                }
              >
                {track.title}
              </Chip>
            )}
          </For>
        </section>
      }
    />
  );
}
