import type { WikipediaSummary } from "./wikipedia";
import { createWindow } from "domino";

type Subject =
  | { kind: "artist"; name: string }
  | { kind: "genre"; name: string }
  | { kind: "album"; name: string; artist: string };

interface SummaryResponse {
  title: string;
  type: string;
  description?: string;
  extract: string;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const cacheSummary = createCache<WikipediaSummary>();
const cacheGenres = createCache<string[]>();

const normalize = (name: string) =>
  name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function matchesTitle(title: string, name: string) {
  return [title, title.replace(/ \([^()]*\)$/, "")].some(
    (candidate) => normalize(candidate) === normalize(name),
  );
}

function albumTitle(name: string) {
  return name
    .replace(/ - (Single|EP)$/i, "")
    .replace(
      /\s*[([][^()[\]]*\b(deluxe|expanded|remaster(?:ed)?|anniversary|bonus track)[^()[\]]*[)\]]$/i,
      "",
    )
    .trim();
}

async function request<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { "User-Agent": "Noisedex/1.0 (https://noisedex.tijn.dev)" },
  });
  if (!response.ok) throw new Error(`Wikipedia: ${response.status}`);
  return response.json();
}

async function lookup(subject: Subject) {
  const signal = AbortSignal.timeout(45_000);
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");

  searchUrl.search = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch:
      subject.kind === "artist"
        ? `${subject.name} music`
        : subject.kind === "genre"
          ? `${subject.name} music genre`
          : `${subject.name} ${subject.artist} album`,
    srlimit: "10",
    srprop: "",
    format: "json",
  }).toString();

  const search = await request<{
    query: { search: { title: string }[] };
  }>(searchUrl, signal);

  const candidates = search.query.search.filter(
    ({ title }) =>
      matchesTitle(title, subject.name) ||
      (subject.kind === "genre" &&
        matchesTitle(
          title.replace(/ music$/i, ""),
          subject.name.replace(/ music$/i, ""),
        )),
  );
  if (!candidates.length) return null;

  // a slow unrelated candidate must not delay a valid summary that is already ready
  const noMatch = Symbol("no matching article");

  try {
    return await Promise.any(
      candidates.map(async ({ title }) => {
        const summary = await request<SummaryResponse>(
          new URL(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
          ),
          signal,
        );

        if (summary.type !== "standard" || !summary.extract?.trim()) {
          throw noMatch;
        }

        const description = `${summary.description ?? ""} ${summary.extract.split(". ")[0]}`;

        const matches =
          subject.kind === "artist"
            ? /\b(band|musician|singer|rapper|songwriter|composer|record producer|DJ|musical (group|duo|trio)|orchestra)\b/i.test(
                description,
              )
            : subject.kind === "genre"
              ? /\b(genre|subgenre|style|form|tradition|movement)\b/i.test(
                  description,
                ) &&
                /\b(music|musical|rock|pop|jazz|punk|metal|house|techno|hip.hop)\b/i.test(
                  description,
                )
              : /\b(album|EP|extended play)\b/i.test(description) &&
                ` ${normalize(description)} `.includes(
                  ` ${normalize(subject.artist)} `,
                );

        if (!matches) throw noMatch;

        return {
          title: summary.title,
          extract: summary.extract,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title.replaceAll(" ", "_"))}`,
        };
      }),
    );
  } catch (error) {
    if (
      error instanceof AggregateError &&
      error.errors.every((reason) => reason === noMatch)
    ) {
      return null;
    }
    // failed requests are not cached as a confirmed missing article.
    throw error;
  }
}

export function getSummary(input: Subject) {
  const subject: Subject =
    input.kind === "album"
      ? { ...input, name: albumTitle(input.name), artist: input.artist.trim() }
      : { ...input, name: input.name.trim() };

  if (!subject.name || (subject.kind === "album" && !subject.artist)) {
    return Promise.resolve(null);
  }

  const key = JSON.stringify([
    subject.kind,
    normalize(subject.name),
    subject.kind === "album" ? normalize(subject.artist) : "",
  ]);

  return cacheSummary(key, () => lookup(subject));
}

export function extractGenres(html: string) {
  const document = createWindow(html).document;
  const genres = new Map<string, string>();

  for (const row of Array.from(document.querySelectorAll("table.infobox tr"))) {
    const label = row.querySelector("th")?.textContent?.trim();
    if (!/^genres?$/i.test(label ?? "")) continue;

    const cell = row.querySelector("td");
    if (!cell) continue;

    for (const noise of Array.from(
      cell.querySelectorAll("sup, style, script, .reference, .noprint"),
    )) {
      noise.parentNode?.removeChild(noise);
    }

    for (const separator of Array.from(cell.querySelectorAll("br"))) {
      separator.parentNode?.replaceChild(
        document.createTextNode("\n"),
        separator,
      );
    }
    const items = Array.from(cell.querySelectorAll("li"));

    const texts = items.length
      ? items.map((item) => item.textContent ?? "")
      : [cell.textContent ?? ""];

    for (const text of texts) {
      for (const part of text.split(/[\n,;•·]+/)) {
        const name = part.replace(/\s+/g, " ").trim();
        if (name && !genres.has(name.toLowerCase()))
          genres.set(name.toLowerCase(), name);
      }
    }
  }
  return [...genres.values()];
}

export function getGenres(title: string) {
  const name = title.trim();
  if (!name) return Promise.resolve([]);

  return cacheGenres(name, async () => {
    const url = new URL("https://en.wikipedia.org/w/api.php");

    url.search = new URLSearchParams({
      action: "parse",
      page: name,
      prop: "text",
      section: "0",
      redirects: "1",
      format: "json",
      formatversion: "2",
    }).toString();

    const result = await request<{ parse: { text: string } }>(
      url,
      AbortSignal.timeout(10_000),
    );

    const genres = extractGenres(result.parse.text);
    return genres.length ? genres : null;
  }).then((genres) => genres ?? []);
}

function createCache<T>() {
  const cache = new Map<
    string,
    {
      value: T | null;
      freshUntil: number;
      staleUntil: number;
    }
  >();
  const pending = new Map<string, Promise<T | null>>();

  return (key: string, lookup: () => Promise<T | null>) => {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && cached.freshUntil > now) {
      return Promise.resolve(cached.value);
    }

    let refresh = pending.get(key);

    if (!refresh) {
      refresh = lookup()
        .then((value) => {
          const now = Date.now();

          cache.set(key, {
            value,
            freshUntil: now + (value ? DAY : 60 * MINUTE),
            staleUntil: now + (value ? 7 * DAY : 60 * MINUTE),
          });

          return value;
        })
        .catch(() => {
          const now = Date.now();
          const stale = cached && cached.staleUntil > now ? cached : undefined;

          cache.set(key, {
            value: stale?.value ?? null,
            freshUntil: now + MINUTE,
            staleUntil: stale?.staleUntil ?? now + MINUTE,
          });

          return stale?.value ?? null;
        })
        .finally(() => {
          pending.delete(key);

          while (cache.size > 500) {
            cache.delete(cache.keys().next().value!);
          }
        });
      pending.set(key, refresh);
    }
    return cached && cached.staleUntil > now
      ? Promise.resolve(cached.value)
      : refresh;
  };
}
