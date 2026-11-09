import { normalizeMusicName } from "#lib/music-preview-data";
import { storeCountryFromLanguages } from "#lib/store-country";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import * as itunes from "itunes-store-api";
import * as v from "valibot";

// iTunes supplies optional audio only; Spotify remains the metadata source.
export const getAlbumPreviews = createServerFn()
  .validator(v.object({ album: v.string(), artist: v.string() }))
  .handler(async ({ data }) => {
    try {
      const result = await itunes.search(data.album, {
        entity: "song",
        media: "music",
        attribute: "albumTerm",
        explicit: true,
        limit: 200,
        country: storeCountryFromLanguages(getRequestHeader("accept-language")),
      });
      const albumName = (name: string) =>
        normalizeMusicName(name.replace(/ - (Single|EP)$/i, ""));
      return result.results
        .filter(
          (track) =>
            albumName(track.collectionName) === albumName(data.album) &&
            normalizeMusicName(track.artistName) ===
              normalizeMusicName(data.artist) &&
            Boolean(track.previewUrl),
        )
        .map((track) => ({
          name: track.trackName,
          artist: track.artistName,
          durationMs: track.trackTimeMillis,
          explicit: track.trackExplicitness === "explicit",
          url: track.previewUrl,
        }));
    } catch {
      return [];
    }
  });
