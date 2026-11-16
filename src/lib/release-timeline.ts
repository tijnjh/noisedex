import type { ResultAlbum } from "itunes-store-api";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});

export function buildReleaseTimeline(releases: ResultAlbum[]) {
  const sorted = releases
    .map((release) => ({ release, date: new Date(release.releaseDate) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return sorted.map(({ release, date }, index) => {
    const previous = sorted[index - 1]?.date;
    const year = date.getUTCFullYear();
    const showYear = year !== previous?.getUTCFullYear();
    const showMonth = showYear || date.getUTCMonth() !== previous?.getUTCMonth();

    return {
      release,
      year,
      showYear,
      month: showMonth ? monthFormatter.format(date).toLowerCase() : null,
      dateTime: date.toISOString().slice(0, 7),
    };
  });
}
