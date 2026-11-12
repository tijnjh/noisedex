import { $itunes } from "#lib/api/index";
import {
  encodeItunesId,
  isSingleRelease,
  parseItunesId,
} from "#lib/api/platforms/itunes-data";
import { AlbumPage, albumHead, loadAlbum } from "./-album";
import { ArtistPage, artistHead, loadArtist } from "./-artist";
import { TrackPage, trackHead, loadTrack } from "./-track";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";

export const Route = createFileRoute("/$itunesId/")({
  validateSearch: v.object({
    filter: v.optional(
      v.fallback(v.picklist(["All", "LPs", "EPs", "Singles"]), "All"),
    ),
  }),

  loader: async ({ params }) => {
    const id = parseItunesId(params.itunesId);
    if (id === undefined) throw notFound();

    const music = await $itunes.getMusic({ data: id });
    if (!music) throw notFound();

    switch (music.type) {
      case "artist":
        return {
          type: "artist" as const,
          data: loadArtist(music),
        };

      case "album":
        if (isSingleRelease(music.album.collectionName, music.tracks.length)) {
          throw redirect({
            to: "/$itunesId",
            params: { itunesId: encodeItunesId(music.tracks[0].trackId) },
            replace: true,
          });
        }

        return {
          type: "album" as const,
          data: loadAlbum(music),
        };

      case "track":
        return {
          type: "track" as const,
          data: loadTrack(music),
        };
    }
  },

  head: ({ loaderData }) => {
    if (!loaderData) return {};

    switch (loaderData.type) {
      case "artist":
        return artistHead(loaderData.data);
      case "album":
        return albumHead(loaderData.data);
      case "track":
        return trackHead(loaderData.data);
    }
  },

  component: MusicPage,
});

function MusicPage() {
  const type = Route.useLoaderData({ select: (music) => music.type });

  switch (type) {
    case "artist":
      return <ArtistPage />;
    case "album":
      return <AlbumPage />;
    case "track":
      return <TrackPage />;
  }
}
