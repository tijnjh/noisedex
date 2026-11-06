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
  if (response.status === 404) throw noMatch;
  if (!response.ok) throw new Error(`Wikipedia: ${response.status}`);
  return response.json();
}

const noMatch = Symbol("no matching Wikipedia article");

function matchesGenreTitle(title: string, name: string) {
  const key = (value: string) =>
    normalize(
      value.replace(/ \([^()]*\)$/, "").replace(/ music$/i, ""),
    ).replaceAll(" ", "");
  return key(title) === key(name);
}

function matchesSubject(summary: SummaryResponse, subject: Subject) {
  if (summary.type !== "standard" || !summary.extract?.trim()) return false;
  const description = `${summary.description ?? ""} ${summary.extract.split(". ")[0]}`;
  const music =
    /\b(music|musical|rock|pop|jazz|punk|metal|house|techno|hip.hop|electronic|dance|soul|blues|rap|folk|reggae)\b/i;

  if (subject.kind === "artist") {
    return (
      /\b(band|musician|singer|rapper|songwriter|composer|record producer|DJ|orchestra)\b/i.test(
        description,
      ) ||
      (music.test(description) &&
        /\b(group|duo|trio|quartet|collective)\b/i.test(description))
    );
  }
  if (subject.kind === "genre") {
    return (
      music.test(description) &&
      /\b([a-z-]*genres?|styles?|forms?|types?|traditions?|movements?|aesthetics?|categories|category|fusion)\b/i.test(
        description,
      )
    );
  }
  return (
    /\b(album|EP|extended play)\b/i.test(description) &&
    ` ${normalize(description)} `.includes(` ${normalize(subject.artist)} `)
  );
}

function hasGenreAlias(summary: SummaryResponse, name: string) {
  const lead = summary.extract
    .split(". ")[0]
    .split(/\b(is|are|was|were)\b/i)[0];
  const alias = normalize(name);
  return (
    alias.length > 1 &&
    Array.from(lead.matchAll(/\(([^()]*)\)/g)).some(([, text]) =>
      ` ${normalize(text)} `.includes(` ${alias} `),
    )
  );
}

async function lookup(subject: Subject) {
  const signal = AbortSignal.timeout(45_000);
  const requests = new Map<string, Promise<SummaryResponse>>();
  const getCandidate = (title: string) => {
    const key = title.replaceAll(" ", "_");
    let pending = requests.get(key);
    if (!pending) {
      pending = request<SummaryResponse>(
        new URL(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
        ),
        signal,
      ).then((summary) => {
        if (!matchesSubject(summary, subject)) throw noMatch;
        return summary;
      });
      requests.set(key, pending);
    }
    return pending;
  };

  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.search = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch:
      subject.kind === "album"
        ? `${subject.name} ${subject.artist} album`
        : `${subject.name} music${subject.kind === "genre" ? " genre" : ""}`,
    srlimit: "10",
    srprop: "redirecttitle",
    format: "json",
  }).toString();

  type SearchResult = { title: string; redirecttitle?: string };
  const search = request<{ query: { search: SearchResult[] } }>(
    searchUrl,
    signal,
  ).then((result) => result.query.search);
  const searchMatches = search.then((results) => {
    const candidates = results.filter(({ title, redirecttitle }) =>
      subject.kind === "genre"
        ? [title, redirecttitle].some(
            (value) => value && matchesGenreTitle(value, subject.name),
          )
        : matchesTitle(title, subject.name),
    );
    return Promise.any(candidates.map(({ title }) => getCandidate(title)));
  });

  const attempts =
    subject.kind === "genre"
      ? [getCandidate(subject.name), searchMatches]
      : [searchMatches];

  let summary: SummaryResponse;

  try {
    summary = await Promise.any(attempts);
  } catch (error) {
    if (subject.kind !== "genre") throw error;

    try {
      const results = await search;
      summary = await Promise.any([
        // broad searches can omit even obvious articles such as classical music
        getCandidate(`${subject.name.replace(/ music$/i, "")} music`),
        ...results.slice(0, 5).map(async ({ title }) => {
          const candidate = await getCandidate(title);
          if (!hasGenreAlias(candidate, subject.name)) throw noMatch;
          return candidate;
        }),
      ]);
    } catch (fallbackError) {
      throw new AggregateError([error, fallbackError]);
    }
  }
  return {
    title: summary.title,
    extract: summary.extract,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title.replaceAll(" ", "_"))}`,
  };
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

  return cacheSummary(key, () =>
    lookup(subject).catch((error) => {
      const isMissing = (reason: unknown): boolean =>
        reason === noMatch ||
        (reason instanceof AggregateError && reason.errors.every(isMissing));

      if (isMissing(error)) return null;

      throw error;
    }),
  );
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
