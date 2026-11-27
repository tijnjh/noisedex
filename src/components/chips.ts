import { Section } from "#components/basics";
import { Chip, type ChipOptions } from "#components/chip";
import { HoverPlay, type HoverPlayProps } from "#components/play";
import { AsyncContent } from "#components/skeleton";
import type { ArtistResult } from "#domain/music";
import { genreNameToSlug, type Artist, type Genre } from "#lib/api/platforms/everynoise-data";
import { encodeItunesId, trimItunesCollectionPostfix } from "#lib/api/platforms/itunes-data";
import { splitArtistCredit, type CreditedArtist } from "#lib/artist-credit";
import { itunesPlayback, previewPlayback } from "#lib/playback";
import type { Html } from "@effect/ui/html";
import type { AsyncResult } from "effect/reactivity";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";
import { genreUrl, musicUrl, searchUrl } from "../routes.ts";

// a chip that plays on hover (if enabled) or touch hold
export const PlayingChip = <M>(
  h: Html.H<M>,
  key: string,
  play: HoverPlayProps,
  chip: ChipOptions<M>,
) =>
  HoverPlay(h, {
    key,
    props: play,
    view: (hoverPlay) => Chip(h, chip, hoverPlay.container(h.div)),
  });

export const GenreChip = <M>(h: Html.H<M>, genre: Genre) => {
  const track = previewPlayback(genre.preview);

  return PlayingChip(
    h,
    genre.genreName,
    {
      load: { _tag: "Track", track },
      card: { _tag: "Always", track, note: "example track" },
    },
    {
      href: genreUrl(genreNameToSlug(genre.genreName)),
      label: genre.genreName,
      tint: genre.style.color,
      className: "lowercase",
    },
  );
};

// everynoise only knows spotify ids, so it jumps to the best itunes match for the name
export const EverynoiseArtistChip = <M>(h: Html.H<M>, artist: Artist) => {
  const track = previewPlayback(artist.preview);

  return PlayingChip(
    h,
    artist.id,
    {
      load: { _tag: "Track", track },
      card: { _tag: "Always", track, note: "example track" },
    },
    {
      href: searchUrl({ q: artist.artistName, lucky: true }),
      label: artist.artistName,
      tint: artist.style.color,
    },
  );
};

export const SearchArtistChip = <M>(h: Html.H<M>, artist: ArtistResult) =>
  Chip(
    h,
    {
      href: musicUrl(encodeItunesId(artist.artistId)),
      label: artist.artistName,
      vt: { title: `artist-${artist.artistId}` },
    },
    h.div.key(String(artist.artistId)),
  );

export const MusicChip = <M>(
  h: Html.H<M>,
  music: ResultAlbum | ResultMusicTrack,
  showArtist = false,
) => {
  const track = music.wrapperType === "track" ? music : undefined;
  const title = track ? track.trackName : trimItunesCollectionPostfix(music.collectionName);

  return PlayingChip(
    h,
    String(track?.trackId ?? music.collectionId),
    track
      ? { load: { _tag: "Track", track: itunesPlayback(track) } }
      : {
          load: { _tag: "FirstTrackOf", albumId: music.collectionId },
          card: { _tag: "WhilePlaying", note: "track 1" },
        },
    {
      href: musicUrl(encodeItunesId(track?.trackId ?? music.collectionId)),
      label: title,
      artwork: music.artworkUrl60,
      vt: track
        ? undefined
        : { title: `album-${music.collectionId}`, img: `album-artwork-${music.collectionId}` },
      subtitle: showArtist ? music.artistName : undefined,
    },
  );
};

export const GenreList = <M>(
  h: Html.H<M>,
  options: { title: string; names: string[]; className?: string | undefined },
) => {
  if (!options.names.length) return [];

  return [
    Section(h, {
      title: options.title,
      className: options.className,
      children: [
        h.div
          .class("cool-grid")
          .children(
            options.names.map((name) =>
              Chip(
                h,
                { href: genreUrl(genreNameToSlug(name)), label: name, className: "lowercase" },
                h.div.key(name),
              ),
            ),
          ),
      ],
    }),
  ];
};

export const ArtistChip = <M>(h: Html.H<M>, artist: CreditedArtist, vt?: string) =>
  artist.artistId
    ? Chip(
        h,
        {
          href: musicUrl(encodeItunesId(artist.artistId)),
          label: artist.name,
          vt: vt ? { title: vt } : undefined,
        },
        h.div.key(artist.name),
      )
    : Chip(
        h,
        { href: searchUrl({ q: artist.name, lucky: true }), label: artist.name },
        h.div.key(artist.name),
      );

export const ArtistChips = <M>(
  h: Html.H<M>,
  options: {
    credit: string;
    artists: AsyncResult.AsyncResult<CreditedArtist[], never>;
    vt?: string;
  },
) =>
  AsyncContent(h, {
    result: options.artists,
    sample: splitArtistCredit(options.credit).map((name) => ({ name })),
    label: "Loading artists",
    children: (artists) => [
      h.div
        .class("flex flex-col gap-3")
        .children(
          artists.map((artist, i) => ArtistChip(h, artist, i === 0 ? options.vt : undefined)),
        ),
    ],
  });
