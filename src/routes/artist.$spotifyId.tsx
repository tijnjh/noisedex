import { $itunes, $spotify } from "#lib/api/index";
import { encodeItunesId } from "#lib/api/platforms/itunes-data";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

// BACKWARDS COMPATIBILITY: remove this eventually
export const Route = createFileRoute("/artist/$spotifyId")({
  loader: async ({ params }) => {
    const spotifyArtist = await $spotify.getArtistById({
      data: params.spotifyId,
    });
    const { artistId } = await $itunes.getAlbumsByArtistName({
      data: spotifyArtist.name,
    });

    if (!artistId) throw notFound();

    throw redirect({
      to: "/artist/$itunesId",
      params: { itunesId: encodeItunesId(artistId) },
      replace: true,
    });
  },
  component: () => null,
});
