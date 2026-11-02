import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $itunes } from "#lib/api/index";
import { nowPlaying } from "#lib/global";
import { trackHead } from "#lib/page-head";
import { fmt, fmtDuration } from "#lib/utils";
import { createFileRoute, notFound, useRouter } from "@tanstack/solid-router";
import { Show } from "solid-js";

export const Route = createFileRoute("/track/$itunesId")({
  loader: async ({ params }) => {
    const track = await $itunes.releases.getTrack(params.itunesId);
    if (!track) throw notFound();
    return { track };
  },
  head: ({ loaderData }) => (loaderData ? trackHead(loaderData.track) : {}),
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const track = () => data().track;
  const backHref = () =>
    router.buildLocation({
      to: "/album/$itunesId",
      params: { itunesId: String(track().albumId) },
    }).href;
  const isPlaying = () =>
    Boolean(track().previewUrl) && nowPlaying().url === track().previewUrl;

  return (
    <Layout
      header={{ title: track().title, backHref: backHref() }}
      leading={
        <div class="flex min-w-0 flex-col gap-3">
          <img
            src={track().artworkUrl}
            alt={`${track().albumName} album cover`}
            class="mx-auto aspect-square w-full max-w-72"
            width={600}
            height={600}
          />

          <Chip to="/search" search={{ lucky: true, q: track().artistName }}>
            {track().artistName}
          </Chip>

          <Show
            when={track().previewUrl}
            fallback={
              <p class="opacity-60">No preview available for this track.</p>
            }
          >
            <div class="flex items-center gap-3">
              <PlayButton
                class="btn-inverse size-9 shrink-0 justify-center"
                aria-label={isPlaying() ? "Stop preview" : "Play preview"}
                aria-pressed={isPlaying() ? "true" : "false"}
                track={{
                  title: `${track().artistName} — ${track().title}`,
                  url: track().previewUrl,
                }}
              />
              <span>
                {isPlaying() ? "Playing preview" : "Listen to a preview"}
              </span>
            </div>
          </Show>

          <PlatformLinks
            for={{
              kind: "track",
              artistName: track().artistName,
              title: track().title,
              appleMusicUrl: track().appleMusicUrl,
            }}
          />
        </div>
      }
      trailing={
        <section
          aria-label="Track details"
          class="flex min-w-0 flex-col gap-3 pb-32 lg:overflow-y-auto"
        >
          <h2 class="section-divider">from the album</h2>
          <Chip
            to="/album/$itunesId"
            params={{ itunesId: String(track().albumId) }}
            leading={track().thumbnailUrl}
          >
            {track().albumName}
          </Chip>

          <h2>Track details</h2>
          <dl>
            <dt>released</dt>
            <dd>
              {fmt("date", new Date(track().releaseDate), {
                dateStyle: "long",
              })}
            </dd>
            <Show when={track().durationMs}>
              {(ms) => (
                <>
                  <dt>duration</dt>
                  <dd>{fmtDuration(ms())}</dd>
                </>
              )}
            </Show>
            <dt
              class="cursor-help"
              title="this genre comes from itunes and is often vague or non-specific"
            >
              genre
            </dt>
            <dd class="wrap-anywhere">{track().genre}</dd>
            <dt>track</dt>
            <dd>
              {track().trackNumber} of {track().trackCount}
            </dd>
            <Show when={track().discCount > 1}>
              <dt>disc</dt>
              <dd>
                {track().discNumber} of {track().discCount}
              </dd>
            </Show>
            <Show when={track().explicit}>
              <dt>content</dt>
              <dd>explicit</dd>
            </Show>
          </dl>
        </section>
      }
    />
  );
}
