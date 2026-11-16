const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });

export function capitalizeWords(text: string): string {
  return Array.from(wordSegmenter.segment(text), ({ segment, isWordLike }) =>
    isWordLike ? segment.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("en")) : segment,
  ).join("");
}

export function viewTransition(name: string | undefined) {
  return name ? { style: { viewTransitionName: name } } : {};
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return Intl.DateTimeFormat("en", options).format(date);
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function formatMillis(millis: number): string {
  const totalSeconds = Math.trunc(millis / 1000);
  const minutes = Math.trunc(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isoDuration(millis: number) {
  return Number.isFinite(millis) ? `PT${Math.round(millis / 1000)}S` : undefined;
}
