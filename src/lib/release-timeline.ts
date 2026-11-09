import type { ResultAlbum } from "itunes-store-api";

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});

export function buildReleaseTimeline(releases: ResultAlbum[]) {
  const sorted = releases
    .filter((release) => release.collectionExplicitness !== "cleaned")
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
    const next = sorted[index + 1]?.date;
    const year = date?.getUTCFullYear() ?? null;

    const showYear =
      index === 0 || year !== (previous?.getUTCFullYear() ?? null);

    const showMonth =
      showYear || date?.getUTCMonth() !== previous?.getUTCMonth();

    // count complete months, so a short gap crossing month boundaries isn't inflated.
    const gapMonths =
      date && next
        ? (date.getUTCFullYear() - next.getUTCFullYear()) * 12 +
          date.getUTCMonth() -
          next.getUTCMonth() -
          (date.getUTCDate() < next.getUTCDate() ? 1 : 0)
        : 0;

    const years = Math.floor(gapMonths / 12);
    const months = gapMonths % 12;

    const gapLabel =
      gapMonths >= 6
        ? [
            years && `${years} ${years === 1 ? "year" : "years"}`,
            months && `${months} ${months === 1 ? "month" : "months"}`,
          ]
            .filter(Boolean)
            .join(", ")
        : null;

    return {
      release,
      year,
      showYear,
      month:
        date && showMonth ? monthFormatter.format(date).toLowerCase() : null,
      dateTime: date?.toISOString().slice(0, 7),
      gapLabel,
    };
  });
}
