import type { ResultAlbum } from "itunes-store-api";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});

export function buildReleaseTimeline(releases: ResultAlbum[]) {
  const sorted = releases
    .map((release) => {
      const date = new Date(release.releaseDate);
      return { release, date: Number.isFinite(date.getTime()) ? date : null };
    })
    .sort((a, b) => {
      if (!a.date) return b.date ? 1 : 0;
      if (!b.date) return -1;
      return b.date.getTime() - a.date.getTime();
    });

  return sorted.map(({ release, date }, index) => {
    const previous = sorted[index - 1]?.date;
    const year = date?.getUTCFullYear() ?? null;

    const showYear = index === 0 || year !== (previous?.getUTCFullYear() ?? null);

    const showMonth = showYear || date?.getUTCMonth() !== previous?.getUTCMonth();

    return {
      release,
      year,
      showYear,
      month: date && showMonth ? monthFormatter.format(date).toLowerCase() : null,
      dateTime: date?.toISOString().slice(0, 7),
    };
  });
}
