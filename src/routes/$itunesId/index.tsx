import { $itunes } from "#lib/api/index";
import {
  encodeItunesId,
  isSingleRelease,
  parseItunesId,
  releaseFilters,
} from "#lib/api/platforms/itunes-data";
import { AlbumPage, albumHead, loadAlbum } from "./-album";
import { ArtistPage, artistHead, loadArtist } from "./-artist";
import { TrackPage, trackHead, loadTrack } from "./-track";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";

// artists, albums and tracks share one id space, so they share this route.
// each kind lives in its own file as a `load` / `head` / `Page` trio
export const Route = createFileRoute("/$itunesId/")({
  validateSearch: v.object({
    // filters the discography on artist pages
    filter: v.optional(v.fallback(v.picklist(releaseFilters), "All")),
  }),

  loader: async ({ params }) => {
    const id = parseItunesId(params.itunesId);
    if (id === undefined) throw notFound();

    const music = await $itunes.getMusic({ data: id });
    if (!music) throw notFound();

    switch (music.type) {
      case "artist":
        return { type: "artist" as const, data: loadArtist(music) };

      case "album":
        // a single is just its one track, so show that instead
        if (isSingleRelease(music.album.collectionName, music.tracks.length)) {
          throw redirect({
            to: "/$itunesId",
            params: { itunesId: encodeItunesId(music.tracks[0].trackId) },
            replace: true,
          });
        }

        return { type: "album" as const, data: loadAlbum(music) };

      case "track":
        return { type: "track" as const, data: loadTrack(music) };
    }
  },

  head: ({ loaderData }) => {
    switch (loaderData?.type) {
      case "artist":
        return artistHead(loaderData.data);
      case "album":
        return albumHead(loaderData.data);
      case "track":
        return trackHead(loaderData.data);
      default:
        return {};
    }
  },

  component: MusicPage,
});

function MusicPage() {
  const music = Route.useLoaderData();

  switch (music.type) {
    case "artist":
      return <ArtistPage {...music.data} />;
    case "album":
      return <AlbumPage {...music.data} />;
    case "track":
      return <TrackPage {...music.data} />;
  }
}
