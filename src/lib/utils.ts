const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });

export function capitalizeWords(text: string): string {
  return Array.from(wordSegmenter.segment(text), ({ segment, isWordLike }) =>
    isWordLike ? segment.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("en")) : segment,
  ).join("");
}

/** props that give an element a view transition name, or nothing when there is no name */
export function viewTransition(name: string | undefined) {
  return name ? { style: { viewTransitionName: name } } : {};
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return Intl.DateTimeFormat("en", options).format(date);
}

export function getErrorMessage(error: unknown) {
  const genericMsg = "an unknown error occurred, check logs for more info";

  switch (typeof error) {
    case "undefined":
      return genericMsg;

    case "string":
      return error;

    case "object":
      if (error === null) return genericMsg;
      if ("message" in error) return (error.message as string) || genericMsg;
      return JSON.stringify(error);

    default:
      return genericMsg;
  }
}

export function formatMillis(millis: number): string {
  const totalSeconds = Math.trunc(millis / 1000);
  const minutes = Math.trunc(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** ISO 8601 duration, as used by schema.org */
export function isoDuration(millis: number) {
  return Number.isFinite(millis) ? `PT${Math.round(millis / 1000)}S` : undefined;
}
