import {
  collectSpotifyPages,
  uniqueSpotifyReleases,
  spotifyReleaseType,
  formatReleaseDate,
} from "../src/lib/api/platforms/spotify-data.ts";
import { buildReleaseTimeline } from "../src/lib/release-timeline.ts";
import assert from "node:assert/strict";
import { test } from "node:test";

test("discography pagination follows every page and deduplicates only IDs", async () => {
  const calls = [];
  const pages = {
    first: {
      items: [
        { id: "one", name: "Album" },
        { id: "two", name: "Album" },
      ],
      next: "second",
    },
    second: {
      items: [
        { id: "one", name: "Album" },
        { id: "old", name: "Early single" },
      ],
      next: null,
    },
  };
  const releases = await collectSpotifyPages("first", async (path) => {
    calls.push(path);
    return pages[path];
  });
  assert.deepEqual(calls, ["first", "second"]);
  assert.deepEqual(
    uniqueSpotifyReleases(releases).map((x) => x.id),
    ["one", "two", "old"],
  );
});

test("pagination fails on a repeated next link instead of looping", async () => {
  await assert.rejects(
    collectSpotifyPages("first", async () => ({ items: [], next: "first" })),
    /Repeated/,
  );
});

test("timeline preserves partial dates and does not invent months or inactivity gaps", () => {
  const rows = buildReleaseTimeline([
    { id: "old", release_date: "2014" },
    { id: "new", release_date: "2026-01-02" },
    { id: "middle", release_date: "2020-03" },
  ]);
  assert.deepEqual(
    rows.map((r) => r.release.id),
    ["new", "middle", "old"],
  );
  assert.deepEqual(
    rows.map((r) => r.month),
    ["jan", "mar", null],
  );
  assert.deepEqual(
    rows.map((r) => r.gapLabel),
    [null, null, null],
  );
  assert.equal(formatReleaseDate("2014"), "2014");
  assert.equal(formatReleaseDate("2014-03"), "March 2014");
  assert.equal(formatReleaseDate("2014-03-21"), "March 21, 2014");
  assert.equal(
    buildReleaseTimeline([
      { release_date: "2026-07-01" },
      { release_date: "2026-01-01" },
    ])[0].gapLabel,
    "6 months",
  );
});

test("release labels do not claim an inferred EP classification as certain", () => {
  assert.equal(
    spotifyReleaseType({
      name: "Remixes",
      album_type: "single",
      total_tracks: 4,
    }),
    "Single / EP",
  );
  assert.equal(
    spotifyReleaseType({ name: "Song", album_type: "single", total_tracks: 1 }),
    "Single",
  );
  assert.equal(
    spotifyReleaseType({
      name: "Named EP",
      album_type: "single",
      total_tracks: 4,
    }),
    "EP",
  );
  assert.equal(
    spotifyReleaseType({ name: "Album", album_type: "album", total_tracks: 9 }),
    "LP",
  );
  assert.equal(
    spotifyReleaseType({
      name: "Collection",
      album_type: "compilation",
      total_tracks: 9,
    }),
    "Compilation",
  );
});
