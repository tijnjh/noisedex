import { Detail, PlatformLinks, Section } from "#components/basics";
import { Chip } from "#components/chip";
import { ArtistChip, ArtistChips, GenreList, MusicChip } from "#components/chips";
import { HoverPlay } from "#components/play";
import { ContentPane, Layout } from "#components/layout";
import { ErrorPage, LoadingPage, NotFoundPage } from "#components/status";
import { AsyncContent } from "#components/skeleton";
import { WikipediaDescription } from "#components/wikipedia";
import type { Music } from "#domain/music";
import {
  encodeItunesId,
  getBigItunesArtwork,
  isSingleRelease,
  matchesReleaseFilter,
  parseItunesId,
  releaseFilters,
} from "#lib/api/platforms/itunes-data";
import { findCollaborators } from "#lib/collaborators";
import { siteName } from "#lib/constants";
import { absoluteUrl, musicHead, pageHead } from "#lib/head";
import { albumLinks, artistLinks, trackLinks } from "#lib/platform-links";
import { itunesPlayback, previewPlayback } from "#lib/playback";
import { buildReleaseTimeline } from "#lib/release-timeline";
import { formatMillis, isoDuration } from "#lib/utils";
import {
  ArtistCredit,
  ArtworkColorsQuery,
  EverynoiseArtist,
  Fantano,
  GetMusic,
  RetryPage,
  WikipediaArticle,
  WikipediaGenres,
} from "#queries/queries";
import { Command, Router, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import type { ResultAlbum } from "itunes-store-api";
import { AppRoute, musicUrl } from "../routes.ts";

const MusicRoute = AppRoute.subset(["Music"]);
type ReleaseFilter = (typeof releaseFilters)[number];

const releaseFilterLabels = { All: "all", LPs: "LPs", EPs: "EPs", Singles: "singles" } as const;

const shownCollaborators = 24;

export const MusicPageMessage = UiSchema.TaggedEnum({
  LoadedMusic: {},
  ClickedReleaseFilter: { filter: Schema.Literals(releaseFilters) },
  ClickedRetry: {},
});

const musicOf = (result: { _tag: string; value?: Music | null }) =>
  result._tag === "Success" ? (result.value ?? undefined) : undefined;

// the artwork the accent colors come from
const artworkOf = (music: Music | undefined) =>
  music?.type === "album"
    ? music.album.artworkUrl100
    : music?.type === "track"
      ? music.track.artworkUrl100
      : undefined;

export const MusicPage = Html.component({
  name: "MusicPage",
  props: Schema.Struct({ route: MusicRoute }),
  model: Schema.Struct({}),
  message: MusicPageMessage,
  queries: {
    music: {
      query: GetMusic,
      args: ({ props }) => {
        const id = parseItunesId(props.route.params.itunesId);
        return id === undefined ? undefined : { id };
      },
      onChange: () => MusicPageMessage.LoadedMusic(),
    },
    colors: {
      query: ArtworkColorsQuery,
      args: ({ queries }) => {
        const url = artworkOf(musicOf(queries.music));
        return url ? { url } : undefined;
      },
    },
    credit: {
      query: ArtistCredit,
      args: ({ queries }) => {
        const music = musicOf(queries.music);
        const release =
          music?.type === "album" ? music.album : music?.type === "track" ? music.track : undefined;
        return release ? { credit: release.artistName, artistId: release.artistId } : undefined;
      },
    },
    everynoise: {
      query: EverynoiseArtist,
      args: ({ queries }) => {
        const music = musicOf(queries.music);
        return music?.type === "artist" ? { name: music.artist.artistName } : undefined;
      },
    },
    wikipedia: {
      query: WikipediaArticle,
      args: ({ queries }) => {
        const music = musicOf(queries.music);
        if (music?.type === "artist")
          return { kind: "artist" as const, name: music.artist.artistName };
        if (music?.type === "album") {
          return {
            kind: "album" as const,
            name: music.album.collectionName,
            artist: music.album.artistName,
          };
        }
        return undefined;
      },
    },
    wikipediaGenres: {
      query: WikipediaGenres,
      args: ({ queries }) =>
        queries.wikipedia._tag === "Success" && queries.wikipedia.value
          ? { title: queries.wikipedia.value.title }
          : undefined,
    },
    fantano: {
      query: Fantano,
      args: ({ queries }) => {
        const music = musicOf(queries.music);
        return music?.type === "album"
          ? { artist: music.album.artistName, album: music.album.collectionName }
          : undefined;
      },
    },
  },
}).make({
  init: () => ({}),
  update: ($, message) =>
    MusicPageMessage.match(message, {
      // a single is just its one track, so show that instead
      LoadedMusic: () => {
        const music = musicOf($.queries.music);
        if (music?.type !== "album") return $.model;
        if (!isSingleRelease(music.album.collectionName, music.tracks.length)) return $.model;
        const [track] = music.tracks;
        if (!track) return $.model;

        return $.run(
          Router.replace(
            AppRoute,
            AppRoute.Music({ params: { itunesId: encodeItunesId(track.trackId) } }),
          ).pipe(Command.asNoop),
        );
      },
      ClickedReleaseFilter: ({ filter }) =>
        $.run(
          Router.patchSearch(AppRoute, $.props.route, {
            filter: filter === "All" ? undefined : filter,
          }).pipe(Command.asNoop),
        ),
      ClickedRetry: () => $.run(RetryPage.make({})),
    }),
  head: ({ queries }) => {
    const music = musicOf(queries.music);
    switch (music?.type) {
      case "artist":
        return artistHead(music);
      case "album":
        return albumHead(music);
      case "track":
        return trackHead(music);
      default:
        return [];
    }
  },
  view: (h) => {
    const { route } = h.props;
    const result = h.queries.music;

    if (parseItunesId(route.params.itunesId) === undefined) return NotFoundPage(h, route);
    if (result._tag === "Initial") return LoadingPage(h, route, "Loading music");
    if (result._tag === "Failure") {
      return ErrorPage(h, {
        route,
        error: result.cause.toString(),
        onRetry: MusicPageMessage.ClickedRetry(),
      });
    }

    const music = result.value;
    if (!music) return NotFoundPage(h, route);

    const { colors, credit, everynoise, wikipedia, wikipediaGenres, fantano } = h.queries;
    const palette = colors._tag === "Success" ? colors.value : undefined;

    switch (music.type) {
      // -----------------------------------------------------------------------
      case "artist": {
        const { artist, albums, tracks } = music;
        const collaborators = findCollaborators(artist, [...albums, ...tracks]);
        const everynoiseArtist = everynoise._tag === "Success" ? everynoise.value : undefined;
        const filter = route.search.filter;

        const timeline = buildReleaseTimeline(
          albums.filter((release) => matchesReleaseFilter(release.collectionName, filter)),
        );

        return Layout(h, {
          key: "layout",
          props: {
            route,
            title: artist.artistName,
            titleVt: `artist-${artist.artistId}`,
            accent: { color: everynoiseArtist?.style.color },
            split: true,
            playback:
              everynoise._tag === "Initial"
                ? { _tag: "Pending" }
                : everynoiseArtist?.preview
                  ? {
                      _tag: "Ready",
                      playback: {
                        track: previewPlayback(everynoiseArtist.preview),
                        note: "example track",
                      },
                    }
                  : undefined,
          },
          slots: {
            leading: [
              PlatformLinks(h, artistLinks(artist.artistName, artist.artistId)),
              ...WikipediaDescription(h, { summary: wikipedia, genres: wikipediaGenres }),
              ...AsyncContent(h, {
                result: everynoise,
                sample: { genres: ["alternative rock", "indie rock"] } as {
                  genres: string[];
                } | null,
                label: "Loading artist genres",
                children: (found) =>
                  GenreList(h, { title: "genres this artist is in", names: found?.genres ?? [] }),
              }),
              ...(artist.primaryGenreName
                ? GenreList(h, {
                    title: "itunes genre",
                    names: [artist.primaryGenreName],
                    className: collaborators.length ? undefined : "lg:mb-32",
                  })
                : []),
              ...(collaborators.length
                ? [
                    Section(h, {
                      title: "collabed with",
                      className: "lg:mb-32",
                      children: [
                        h.div
                          .class("flex flex-wrap gap-grid-gap")
                          .children(
                            collaborators
                              .slice(0, shownCollaborators)
                              .map(({ name, artistId }) => ArtistChip(h, { name, artistId })),
                          ),
                      ],
                    }),
                  ]
                : []),
            ],
            trailing: [
              ContentPane(h, {
                label: "Release timeline",
                children: [
                  h.h2.class("section-divider").children("discography"),
                  h.div
                    .attrs({ role: "group", "aria-label": "Release type" })
                    .class("flex gap-3")
                    .children(
                      releaseFilters.map((type: ReleaseFilter) =>
                        h.button
                          .key(type)
                          .attrs({ type: "button", "aria-pressed": String(filter === type) })
                          .on("click", MusicPageMessage.ClickedReleaseFilter({ filter: type }))
                          .class(filter === type ? "btn-inverse" : "btn")
                          .children(releaseFilterLabels[type]),
                      ),
                    ),
                  !timeline.length && h.p.attr("role", "status").children("no releases found"),
                  ...timeline.flatMap(({ release, year, showYear, month, dateTime }) => [
                    showYear &&
                      h.h2
                        .key(`year-${release.collectionId}`)
                        .class("flex h-9 items-center gap-3 font-semibold tabular-nums")
                        .children(
                          String(year),
                          h.span.class("grow border-t border-zinc-950-50/20"),
                        ),
                    h.div
                      .key(String(release.collectionId))
                      .class("grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3")
                      .children(
                        h.span
                          .class("text-right font-mono text-sm opacity-50")
                          .children(month && h.time.attr("datetime", dateTime).children(month)),
                        MusicChip(h, release as ResultAlbum),
                      ),
                  ]),
                  h.div.class("h-29 shrink-0"),
                ],
              }),
            ],
          },
        });
      }

      // -----------------------------------------------------------------------
      case "album": {
        const { album, tracks } = music;

        return Layout(h, {
          key: "layout",
          props: {
            route,
            title: album.collectionName,
            titleVt: `album-${album.collectionId}`,
            accent: {
              color: palette?.accent,
              background: palette?.background,
              middle: palette?.middle,
              artwork: album.artworkUrl100,
            },
            split: true,
            artwork: {
              src: getBigItunesArtwork(album),
              alt: `${album.collectionName} album cover`,
              vt: `album-artwork-${album.collectionId}`,
            },
          },
          slots: {
            leading: [
              h.div.class("flex flex-col gap-3 lg:mb-32").children(
                ArtistChips(h, {
                  credit: album.artistName,
                  artists: credit,
                  vt: `artist-${album.artistId}`,
                }),
                h.p.children(
                  `released ${new Date(album.releaseDate).toLocaleDateString("en", { dateStyle: "long" })}`,
                ),
                PlatformLinks(h, albumLinks(album)),
                AsyncContent(h, {
                  result: fantano,
                  sample: {
                    excerpt:
                      "An album full of distinctive sounds and memorable moments, with plenty to discover across its tracks. Each listen reveals another detail in the music.",
                    url: "https://theneedledrop.com/",
                  } as { excerpt: string | null; url: string } | null,
                  label: "Loading The Needle Drop review",
                  children: (found) =>
                    found?.excerpt
                      ? [
                          h.figure.class("mt-3 border-l-2 border-current/25 pl-4").children(
                            h.blockquote
                              .attr("cite", found.url)
                              .class("inline italic")
                              .children(
                                h.p
                                  .class("inline whitespace-pre-line")
                                  .children(`“${found.excerpt.trim()}”`),
                              ),
                            h.figcaption.children(
                              h.a
                                .attrs({ href: found.url, target: "_blank", rel: "noreferrer" })
                                .class("underline opacity-50 hover:opacity-100")
                                .children("theneedledrop.com"),
                            ),
                          ),
                        ]
                      : [],
                }),
                WikipediaDescription(h, {
                  summary: wikipedia,
                  genres: wikipediaGenres,
                }),
              ),
            ],
            trailing: [
              ContentPane(h, {
                label: "Track list",
                className: "overflow-x-clip pb-32 lg:h-full",
                children: [
                  h.h2.class("section-divider").children("tracks"),
                  h.div
                    .class("grid w-full grid-cols-[max-content_1fr] gap-3")
                    .children(tracks.map((track) => TrackRow(h, track))),
                ],
              }),
            ],
          },
        });
      }

      // -----------------------------------------------------------------------
      case "track": {
        const { track } = music;
        // a single has no album page of its own, so its track page stands in for it
        const isSingle = isSingleRelease(track.collectionName, track.trackCount);

        return Layout(h, {
          key: "layout",
          props: {
            route,
            title: track.trackName,
            titleVt: isSingle ? `album-${track.collectionId}` : undefined,
            accent: {
              color: palette?.accent,
              background: palette?.background,
              middle: palette?.middle,
              artwork: track.artworkUrl100,
            },
            split: true,
            playback: track.previewUrl
              ? {
                  _tag: "Ready",
                  playback: { track: itunesPlayback(track), note: "30 second preview" },
                }
              : undefined,
            artwork: {
              src: getBigItunesArtwork(track),
              alt: `${track.collectionName} album cover`,
              vt: isSingle ? `album-artwork-${track.collectionId}` : undefined,
            },
          },
          slots: {
            leading: [
              h.div
                .class("flex min-w-0 flex-col gap-3 lg:mb-32")
                .children(
                  ArtistChips(h, { credit: track.artistName, artists: credit }),
                  PlatformLinks(h, trackLinks(track)),
                ),
            ],
            trailing: [
              ContentPane(h, {
                label: "Track details",
                className: "pb-32",
                children: [
                  ...(isSingle
                    ? []
                    : [
                        h.h2.class("section-divider").children("from the album"),
                        Chip(h, {
                          href: musicUrl(encodeItunesId(track.collectionId)),
                          label: track.collectionName,
                          artwork: track.artworkUrl60,
                          vt: {
                            title: `album-${track.collectionId}`,
                            img: `album-artwork-${track.collectionId}`,
                          },
                        }),
                      ]),
                  h.h2.children("track details"),
                  h.dl.children(
                    Detail(h, {
                      label: ["released"],
                      children: [
                        new Date(track.releaseDate).toLocaleDateString("en", { dateStyle: "long" }),
                      ],
                    }),
                    Number.isFinite(track.trackTimeMillis) &&
                      Detail(h, {
                        label: ["duration"],
                        children: [formatMillis(track.trackTimeMillis)],
                      }),
                    Detail(h, {
                      label: [
                        h.span
                          .class("cursor-help")
                          .attr(
                            "title",
                            "this genre comes from itunes and is often vague or non-specific",
                          )
                          .children("genre"),
                      ],
                      className: "wrap-anywhere capitalize",
                      children: [track.primaryGenreName],
                    }),
                    !isSingle &&
                      Detail(h, {
                        label: ["track"],
                        children: [`${track.trackNumber} of ${track.trackCount}`],
                      }),
                    track.discCount > 1 &&
                      Detail(h, {
                        label: ["disc"],
                        children: [`${track.discNumber} of ${track.discCount}`],
                      }),
                    track.trackExplicitness === "explicit" &&
                      Detail(h, { label: ["content"], children: ["explicit"] }),
                  ),
                ],
              }),
            ],
          },
        });
      }
    }
  },
});

// a track of an album's track list, which plays while hovered
const TrackRow = <M>(h: Html.H<M>, track: Extract<Music, { type: "album" }>["tracks"][number]) =>
  HoverPlay(h, {
    key: String(track.trackId),
    props: {
      load: { _tag: "Track", track: itunesPlayback(track) },
      card: { _tag: "WhilePlaying", note: track.previewUrl ? "30 second preview" : undefined },
    },
    view: (hoverPlay) =>
      hoverPlay
        .container(h.div.class("col-span-full grid w-full grid-cols-subgrid"))
        .children(
          h.div.class("flex items-center justify-end").children(String(track.trackNumber)),
          Chip(h, { href: musicUrl(encodeItunesId(track.trackId)), label: track.trackName }),
        ),
  });

// ---------------------------------------------------------------------------
// heads
// ---------------------------------------------------------------------------

function artistHead({ artist }: Extract<Music, { type: "artist" }>) {
  return pageHead({
    title: `${artist.artistName} discography`,
    description: `Browse albums and music genres for ${artist.artistName} on ${siteName}.`,
    path: `/${encodeItunesId(artist.artistId)}`,
  });
}

function albumHead({ album, tracks }: Extract<Music, { type: "album" }>) {
  const artwork = getBigItunesArtwork(album);

  return musicHead({
    title: `${album.collectionName} by ${album.artistName}`,
    description: `Explore ${album.collectionName} by ${album.artistName}: release date, genre, and ${tracks.length} tracks with previews on ${siteName}.`,
    path: `/${encodeItunesId(album.collectionId)}`,
    artwork,
    type: "music.album",
    jsonLd: {
      "@type": "MusicAlbum",
      name: album.collectionName,
      byArtist: { "@type": "MusicGroup", name: album.artistName },
      datePublished: album.releaseDate,
      genre: album.primaryGenreName,
      image: artwork,
      numTracks: tracks.length,
      track: tracks.map((track) => ({
        "@type": "MusicRecording",
        name: track.trackName,
        position: track.trackNumber,
        duration: isoDuration(track.trackTimeMillis),
      })),
    },
  });
}

function trackHead({ track }: Extract<Music, { type: "track" }>) {
  const artwork = getBigItunesArtwork(track);

  return musicHead({
    title: `${track.trackName} by ${track.artistName}`,
    description: `Explore ${track.trackName} by ${track.artistName} from ${track.collectionName}: release date, genre, and listening links on ${siteName}.`,
    path: `/${encodeItunesId(track.trackId)}`,
    artwork,
    type: "music.song",
    jsonLd: {
      "@type": "MusicRecording",
      name: track.trackName,
      byArtist: { "@type": "MusicGroup", name: track.artistName },
      inAlbum: {
        "@type": "MusicAlbum",
        name: track.collectionName,
        url: absoluteUrl(`/${encodeItunesId(track.collectionId)}`),
      },
      datePublished: track.releaseDate,
      genre: track.primaryGenreName,
      image: artwork,
      duration: isoDuration(track.trackTimeMillis),
    },
  });
}
