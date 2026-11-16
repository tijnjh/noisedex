import { AsyncContent } from "#components/async-content";
import { Chip } from "#components/chip";
import { GenreList } from "#components/genre-list";
import { Layout } from "#components/layout";
import { MusicChip } from "#components/music-chip";
import { PlatformLinks } from "#components/platform-links";
import { WikipediaDescription } from "#components/wikipedia-description";
import { $appleMusic, $everynoise, $wikipedia } from "#lib/api/index";
import type { AppleMusicArtistImages } from "#lib/api/platforms/apple-music.server";
import { genreNameToSlug } from "#lib/api/platforms/everynoise-data";
import { encodeItunesId, getReleaseType } from "#lib/api/platforms/itunes-data";
import { siteName, siteUrl } from "#lib/constants";
import { artistLinks } from "#lib/platform-links";
import { buildReleaseTimeline } from "#lib/release-timeline";
import { scrollRegions } from "#lib/scroll-regions";
import { Await, getRouteApi } from "@tanstack/react-router";
import { cn } from "cn";
import type { ResultAlbum, ResultMusicArtist } from "itunes-store-api";
import { Fragment, Suspense } from "react";

const musicRoute = getRouteApi("/$itunesId/");

type ArtistData = ReturnType<typeof loadArtist>;

export function loadArtist({
  artist,
  albums,
}: {
  artist: ResultMusicArtist;
  albums: ResultAlbum[];
}) {
  const { summary: wikipediaArtist, genres: wikipediaArtistGenres } = $wikipedia.enrichWithGenres(
    $wikipedia.getArtistByName({ data: artist.artistName }),
  );

  const everynoiseArtist = $everynoise.getArtistByName(artist.artistName).catch(() => undefined);

  const appleMusicImages = $appleMusic
    .getArtistImages({ data: artist.artistId })
    .catch(() => ({ profileImage: null, logo: null }));

  return {
    artist,
    albums,
    wikipediaArtist,
    wikipediaArtistGenres,
    everynoiseArtist,
    appleMusicImages,
    accentColor: everynoiseArtist.then((artist) => artist?.style.color),
  };
}

export function artistHead(data: ArtistData) {
  return {
    meta: [
      {
        title: `${data.artist.artistName} albums • ${siteName}`,
      },
      {
        name: "description",
        content: `Browse albums and music genres for ${data.artist.artistName} on ${siteName}.`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `${siteUrl}/${encodeItunesId(data.artist.artistId)}`,
      },
    ],
  };
}

export function ArtistPage() {
  const music = musicRoute.useLoaderData();
  if (music.type !== "artist") return;
  const data = music.data;

  const {
    artist,
    wikipediaArtist,
    wikipediaArtistGenres,
    everynoiseArtist,
    appleMusicImages,
    accentColor,
  } = data;
  const genre = artist.primaryGenreName;

  return (
    <Layout
      header={{
        title: artist.artistName,
        titleVt: `artist-${artist.artistId}`,
        heading: <ArtistHeading name={artist.artistName} images={appleMusicImages} />,
      }}
      accentColor={accentColor}
      leading={
        <>
          <PlatformLinks links={artistLinks(artist.artistName, artist.artistId)} />

          <WikipediaDescription summary={wikipediaArtist} genres={wikipediaArtistGenres} />

          <AsyncContent<{ genres: string[] } | undefined>
            promise={everynoiseArtist}
            sample={{ genres: ["alternative rock", "indie rock"] }}
            label="Loading artist genres"
          >
            {(result) => (
              <GenreList title="genres this artist is in" names={result?.genres ?? []} />
            )}
          </AsyncContent>

          {genre && (
            <>
              <span className="section-divider">itunes genre</span>
              <div className="cool-grid">
                <Chip
                  className="capitalize"
                  to="/genre/$slug"
                  params={{ slug: genreNameToSlug(genre) }}
                >
                  {genre}
                </Chip>
              </div>
            </>
          )}
        </>
      }
      trailing={<ArtistReleasesList />}
    />
  );
}

// like the ios apple music app: the artist photo as a hero, with the custom name logo
// (or the plain name) in white at the bottom left over a dark gradient
function ArtistHeading({
  name,
  images,
}: {
  name: string;
  images: Promise<AppleMusicArtistImages>;
}) {
  return (
    <Suspense fallback={name}>
      <Await promise={images}>
        {({ profileImage, logo }) =>
          profileImage ? (
            <span
              style={{ backgroundColor: profileImage.bgColor }}
              className="relative block aspect-square w-full overflow-hidden md:aspect-4/3"
            >
              <img
                src={profileImage.url}
                alt=""
                width={profileImage.width}
                height={profileImage.height}
                className="absolute inset-0 size-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex p-5 text-white text-shadow-lg md:p-6">
                {logo ? (
                  <img
                    src={logo.url}
                    alt={name}
                    title={name}
                    width={logo.width}
                    height={logo.height}
                    className="size-auto max-h-24 max-w-3/4 object-contain object-left md:max-h-28"
                  />
                ) : (
                  name
                )}
              </span>
            </span>
          ) : (
            name
          )
        }
      </Await>
    </Suspense>
  );
}

function ArtistReleasesList() {
  const releases = musicRoute.useLoaderData({
    select: (music) => (music.type === "artist" ? music.data.albums : []),
  });
  const { filter = "All" } = musicRoute.useSearch();
  const navigate = musicRoute.useNavigate();
  const timeline = buildReleaseTimeline(
    releases.filter(
      (release) => filter === "All" || getReleaseType(release.collectionName) + "s" === filter,
    ),
  );

  return (
    <div
      aria-label="Release timeline"
      data-scroll-restoration-id={scrollRegions.content}
      className="flex min-w-0 flex-col gap-3 lg:overflow-y-auto"
    >
      <div role="group" aria-label="Release type" className="flex gap-3">
        {(["All", "LPs", "EPs", "Singles"] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={filter === type}
            onClick={() =>
              navigate({
                search: (previous) => ({
                  ...previous,
                  filter: type === "All" ? undefined : type,
                }),
                resetScroll: false,
              })
            }
            className={cn("cursor-pointer", filter === type ? "btn-inverse h-9" : "btn h-9")}
          >
            {type}
          </button>
        ))}
      </div>

      {!timeline.length && <p role="status">No releases found.</p>}

      {timeline.map(({ release, year, showYear, month, dateTime }) => (
        <Fragment key={release.collectionId}>
          {showYear && (
            <h2 className="flex h-9 items-center gap-3 font-semibold tabular-nums not-first:mt-6">
              {year ?? "Unknown date"}
              <span className="grow border-t border-zinc-300-700" />
            </h2>
          )}

          <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-right font-mono text-sm opacity-50">
              {month && <time dateTime={dateTime}>{month}</time>}
            </span>
            <MusicChip music={release} />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
