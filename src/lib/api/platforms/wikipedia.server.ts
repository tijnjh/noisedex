import { cached, day } from "../../cache.server";
import { trimItunesCollectionPostfix } from "./itunes-data";
import * as cheerio from "cheerio";

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

const noMatch = Symbol("no matching Wikipedia article");

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
  return trimItunesCollectionPostfix(name)
    .replace(
      /\s*[([][^()[\]]*\b(deluxe|expanded|remaster(?:ed)?|anniversary|bonus track)[^()[\]]*[)\]]$/i,
      "",
    )
    .trim();
}

async function request<T>(url: URL, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { "User-Agent": "Noisedex/1.0 (https://noisedex.com)" },
  });
  if (response.status === 404) throw noMatch;
  if (!response.ok) throw new Error(`Wikipedia: ${response.status}`);
  return response.json();
}

function matchesGenreTitle(title: string, name: string) {
  const key = (value: string) =>
    normalize(value.replace(/ \([^()]*\)$/, "").replace(/ music$/i, "")).replaceAll(" ", "");
  return key(title) === key(name);
}

const kindTerms = {
  artist:
    /\b(band|musician|singer|rapper|songwriter|composer|record producer|DJ|orchestra|group|duo|trio|quartet|collective)\b/i,
  genre:
    /\b([a-z-]*genres?|styles?|forms?|types?|traditions?|movements?|aesthetics?|categories|category|fusion)\b/i,
  album: /\b(album|EP|extended play|mixtape)\b/i,
  song: /\b(song|single)\b/i,
};

// the earliest type term decides what an article is about,
// so "a song by the synthpop band Freezepop" is a song and not a band
function leadingKind(description: string) {
  let leading: { kind: string; index: number } | undefined;
  for (const [kind, pattern] of Object.entries(kindTerms)) {
    const index = description.search(pattern);
    if (index !== -1 && (!leading || index < leading.index)) leading = { kind, index };
  }
  return leading?.kind;
}

function matchesSubject(summary: SummaryResponse, subject: Subject) {
  if (summary.type !== "standard" || !summary.extract?.trim()) return false;
  const description = `${summary.description ?? ""} ${summary.extract.split(". ")[0]}`;
  if (leadingKind(description) !== subject.kind) return false;

  const music =
    /\b(music|musical|rock|pop|jazz|punk|metal|house|techno|hip.hop|electronic|dance|soul|blues|rap|folk|reggae)\b/i;

  if (subject.kind === "artist") {
    return (
      /\b(band|musician|singer|rapper|songwriter|composer|record producer|DJ|orchestra)\b/i.test(
        description,
      ) || music.test(description)
    );
  }
  if (subject.kind === "genre") return music.test(description);
  return ` ${normalize(description)} `.includes(` ${normalize(subject.artist)} `);
}

function hasGenreAlias(summary: SummaryResponse, name: string) {
  const lead = summary.extract.split(". ")[0].split(/\b(is|are|was|were)\b/i)[0];
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
  const getCandidate = async (title: string) => {
    const summary = await request<SummaryResponse>(
      new URL(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
      ),
      signal,
    );
    if (!matchesSubject(summary, subject)) throw noMatch;
    return summary;
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
  const search = request<{ query: { search: SearchResult[] } }>(searchUrl, signal).then(
    (result) => result.query.search,
  );
  const searchMatches = search.then((results) => {
    const candidates = results.filter(({ title, redirecttitle }) =>
      subject.kind === "genre"
        ? [title, redirecttitle].some((value) => value && matchesGenreTitle(value, subject.name))
        : matchesTitle(title, subject.name),
    );
    return Promise.any(candidates.map(({ title }) => getCandidate(title)));
  });

  const attempts =
    subject.kind === "genre" ? [getCandidate(subject.name), searchMatches] : [searchMatches];

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

const isMissing = (reason: unknown): boolean =>
  reason === noMatch || (reason instanceof AggregateError && reason.errors.every(isMissing));

// misses are cached as null, failures reject and get retried
const cachedLookup = cached(
  (subject: Subject) =>
    lookup(subject).catch((error) => {
      if (isMissing(error)) return null;
      throw error;
    }),
  day,
);

export function getSummary(subject: Subject) {
  return cachedLookup(
    subject.kind === "album" ? { ...subject, name: albumTitle(subject.name) } : subject,
  );
}

function extractGenres(html: string) {
  const $ = cheerio.load(html);
  const genres = new Map<string, string>();

  for (const row of $("table.infobox tr")) {
    const $row = $(row);
    if (!/^genres?$/i.test($row.find("th").text().trim())) continue;

    const cell = $row.find("td");
    cell.find("sup, style, script, .reference, .noprint").remove();
    cell.find("br").replaceWith("\n");

    const items = Array.from(cell.find("li"));
    const texts = items.length ? items.map((item) => $(item).text()) : [cell.text()];

    for (const text of texts) {
      for (const part of text.split(/[\n,;•·]+/)) {
        const name = part.replace(/\s+/g, " ").trim();
        if (name && !genres.has(name.toLowerCase())) genres.set(name.toLowerCase(), name);
      }
    }
  }
  return [...genres.values()];
}

export const getGenres = cached(async (title: string) => {
  const url = new URL("https://en.wikipedia.org/w/api.php");

  url.search = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    section: "0",
    redirects: "1",
    format: "json",
    formatversion: "2",
  }).toString();

  const result = await request<{ parse: { text: string } }>(url, AbortSignal.timeout(10_000));

  return extractGenres(result.parse.text);
}, day);
