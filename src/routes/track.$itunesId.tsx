import { Chip } from "#components/chip";
import { Layout } from "#components/layout";
import { PlatformLinks } from "#components/platform-links";
import { PlayButton } from "#components/play-button";
import { $itunes, $soundcloud } from "#lib/api/index";
import { siteName, siteUrl } from "#lib/constants";
import { nowPlayingAtom } from "#lib/global";
import { fmt, getBigItunesArtwork } from "#lib/utils";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

export const Route = createFileRoute("/track/$itunesId")({
  loader: async ({ params }) => {
    const id = Number(params.itunesId);
    if (!/^\d+$/.test(params.itunesId) || !Number.isSafeInteger(id) || id <= 0)
      throw notFound();

    const response = await $itunes.isa.lookup("id", id, {
      media: "music",
      entity: "song",
    });
    const track = response.results.find(
      (result) =>
        result.wrapperType === "track" &&
        result.kind === "song" &&
        result.trackId === id,
    );
    if (!track) throw notFound();

    const soundcloud = await $soundcloud.matchAlbum({
      data: { artist: track.artistName, album: track.collectionName },
    });
    return { track, soundcloud };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { track } = loaderData;
    const title = `${track.trackName} by ${track.artistName} | ${siteName}`;
    const description = `Explore ${track.trackName} by ${track.artistName} from ${track.collectionName}: release date, genre, and listening links on ${siteName}.`;
    const url = `${siteUrl}/track/${params.itunesId}`;
    const artwork = getBigItunesArtwork(track);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "music.song" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: artwork },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            "@id": url,
            url,
            name: track.trackName,
            byArtist: { "@type": "MusicGroup", name: track.artistName },
            inAlbum: {
              "@type": "MusicAlbum",
              name: track.collectionName,
              url: `${siteUrl}/album/${track.collectionId}`,
            },
            datePublished: track.releaseDate,
            genre: track.primaryGenreName,
            image: artwork,
            duration: Number.isFinite(track.trackTimeMillis)
              ? `PT${Math.round(track.trackTimeMillis / 1000)}S`
              : undefined,
          }).replace(/</g, "\\u003c"),
        },
      ],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const nowPlaying = useAtomValue(nowPlayingAtom);
  const track = data.track;
  const backHref = router.buildLocation({
    to: "/album/$itunesId",
    params: { itunesId: String(track.collectionId) },
  }).href;
  const constructedSearchQuery = encodeURIComponent(
    `${track.artistName} ${track.trackName}`,
  );
  const seconds = Math.floor(track.trackTimeMillis / 1000);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const fullUrl = $soundcloud.trackUrl(
    data.soundcloud,
    track.trackName,
    track.artistName,
  );
  const playbackUrl = fullUrl ?? track.previewUrl;
  const isPlaying = Boolean(playbackUrl) && nowPlaying.url === playbackUrl;

  return (
    <Layout
      header={{ title: track.trackName, backHref }}
      leading={
        <div className="flex min-w-0 flex-col gap-3">
          <img
            src={getBigItunesArtwork(track)}
            alt={`${track.collectionName} album cover`}
            className="mx-auto aspect-square w-full max-w-72"
            width={600}
            height={600}
          />

          <Chip to="/search" search={{ lucky: true, q: track.artistName }}>
            {track.artistName}
          </Chip>

          {playbackUrl ? (
            <div className="flex items-center gap-3">
              <PlayButton
                className="btn-inverse size-9 shrink-0 justify-center"
                aria-label={isPlaying ? "Stop playback" : "Play track"}
                aria-pressed={isPlaying ? "true" : "false"}
                track={{
                  title: `${track.artistName} — ${track.trackName}`,
                  url: playbackUrl,
                }}
              />
              <span>
                {fullUrl ? "Listen on SoundCloud" : "Listen to a preview"}
              </span>
            </div>
          ) : (
            <p className="opacity-60">No preview available for this track.</p>
          )}

          <PlatformLinks
            links={[
              {
                name: "last.fm",
                icon: "/last-fm.ico",
                href: `https://last.fm/music/${encodeURIComponent(track.artistName)}/_/${encodeURIComponent(track.trackName)}`,
              },
              {
                name: "spotify",
                icon: "/spotify-com.png",
                href: `https://open.spotify.com/search/${constructedSearchQuery}`,
              },
              {
                name: "apple music",
                icon: "/music-apple-com.png",
                href: track.trackViewUrl,
              },
              {
                name: "bandcamp",
                icon: "/bandcamp-com.png",
                href: `https://bandcamp.com/search?q=${constructedSearchQuery}&item_type=t`,
              },
              {
                name: "soundcloak",
                href: `https://sc.maid.zone/search?q=${constructedSearchQuery}&type=tracks`,
              },
            ]}
          />
        </div>
      }
      trailing={
        <section
          aria-label="Track details"
          className="flex min-w-0 flex-col gap-3 pb-32 lg:overflow-y-auto"
        >
          <h2 className="section-divider">from the album</h2>
          <Chip
            to="/album/$itunesId"
            params={{ itunesId: String(track.collectionId) }}
            leading={track.artworkUrl60}
          >
            {track.collectionName}
          </Chip>

          <h2>Track details</h2>
          <dl>
            <dt>released</dt>
            <dd>
              {fmt("date", new Date(track.releaseDate), {
                dateStyle: "long",
              })}
            </dd>
            {Number.isFinite(track.trackTimeMillis) && (
              <>
                <dt>duration</dt>
                <dd>{duration}</dd>
              </>
            )}
            <dt
              className="cursor-help"
              title="this genre comes from itunes and is often vague or non-specific"
            >
              genre
            </dt>
            <dd className="wrap-anywhere">{track.primaryGenreName}</dd>
            <dt>track</dt>
            <dd>
              {track.trackNumber} of {track.trackCount}
            </dd>
            {track.discCount > 1 && (
              <>
                <dt>disc</dt>
                <dd>
                  {track.discNumber} of {track.discCount}
                </dd>
              </>
            )}
            {track.trackExplicitness === "explicit" && (
              <>
                <dt>content</dt>
                <dd>explicit</dd>
              </>
            )}
          </dl>
        </section>
      }
    />
  );
}
