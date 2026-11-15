// wikipedia names for genres everynoise calls something else
const genreAliases: Record<string, string> = {
  "alt country": "alternative country",
  alternative: "alternative rock",
  aor: "album rock",
  "british hip hop": "uk hip hop",
  bubblegum: "bubblegum pop",
  "classic hip hop": "old school hip hop",
  "comedy hip hop": "comedy rap",
  "conscious rap": "conscious hip hop",
  "contemporary christian": "ccm",
  "contemporary christian music": "ccm",
  countrypolitan: "nashville sound",
  "dmv hip hop": "dmv rap",
  "east coast rap": "east coast hip hop",
  "electro-funk": "electro",
  "electro-rock": "electronic rock",
  electronic: "electronica",
  "electronic dance": "edm",
  "electronic dance music": "edm",
  "electronic music": "electronica",
  "emo pop": "pop emo",
  "film score": "soundtrack",
  "french rap": "french hip hop",
  "gangsta rap": "gangster rap",
  "german rap": "german hip hop",
  "hardcore rap": "hardcore hip hop",
  "heavy metal": "metal",
  "indie electronic": "indie electronica",
  "irish traditional": "irish folk",
  "irish traditional music": "irish folk",
  "korean hip hop": "k-rap",
  "latin r&b": "r&b en espanol",
  "latin trap": "trap latino",
  "latin urban": "urbano latino",
  "neo-psychedelia": "neo-psychedelic",
  "philadelphia soul": "philly soul",
  "political rap": "political hip hop",
  "post-bop": "contemporary post-bop",
  psychedelia: "psychedelic rock",
  psychedelic: "psychedelic rock",
  "psychedelic rap": "psychedelic hip hop",
  "punk rock": "punk",
  rapcore: "rap rock",
  "rhythm & blues": "rhythm and blues",
  rnb: "r&b",
  "rock & roll": "rock-and-roll",
  "rock 'n' roll": "rock-and-roll",
  shoegazing: "shoegaze",
  "traditional irish": "irish folk",
  "twin cities hip hop": "minnesota hip hop",
  "uk rap": "uk hip hop",
  urban: "urban contemporary",
  urbano: "urbano latino",
  "west coast hip hop": "west coast rap",
};

function toSlug(genre: string) {
  return genre
    .normalize("NFD")
    .replace(/\(.*?\)/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const aliasSlugs = new Map(
  Object.entries(genreAliases).map(([from, to]) => [toSlug(from), toSlug(to)]),
);

export function genreNameToSlug(genre: string | undefined | null) {
  if (!genre) return;
  const slug = toSlug(genre);
  return aliasSlugs.get(slug) ?? slug;
}

export function findSoundOfPlaylistId(links: Array<{ text: string; href: string }>) {
  const fullUrl = links.find((l) => l.text === "playlist")?.href;
  if (!fullUrl) return;
  return fullUrl.replace("https://open.spotify.com/playlist/", "");
}

export function splitPreviewTitle(previewTitle: string | undefined | null) {
  if (previewTitle == null) return;

  if (previewTitle.startsWith("e.g.")) {
    previewTitle = previewTitle.replace("e.g.", "");
  }

  const match = previewTitle.trim().match(/^(.+?)\s+"([\s\S]*)"$/);
  if (!match) return;

  const [, artist, title] = match;
  return { artist: artist.trimEnd(), title };
}
