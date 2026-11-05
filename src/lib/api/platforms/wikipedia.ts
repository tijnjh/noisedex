import ky from "ky";

export const wikipediaKy = ky.create({
  baseUrl: "https://en.wikipedia.org",
});

export const wikipediaRestKy = wikipediaKy.extend({
  prefix: "/api/rest_v1",
});

export const wikipediaPhpKy = wikipediaKy.extend({
  prefix: "/w/api.php",
});

const probableArtistNouns = ["band", "artist", "musician"];

function wikiNormalize(title: string) {
  encodeURIComponent(title).replaceAll("%20", "_");
}

export async function getArtistDescriptionByName(artistName: string) {
  const disambiguationResult = await wikipediaPhpKy("", {
    searchParams: {
      action: "query",
      generator: "links",
      titles: artistName,
      gpllimit: 150,
      format: "json",
    },
  }).json<{
    query?: {
      pages: Record<string, { title: string }>;
    };
  }>();

  console.log(disambiguationResult.query?.pages);

  if (!Object.values(disambiguationResult.query?.pages ?? []).length) {
    console.log("empty disambu query");

    const result = await wikipediaRestKy(
      `/page/summary/${wikiNormalize(artistName)}`,
    ).json<{
      title: string;
      type: string;
      extract: string;
    }>();

    return result;
  }

  const narrowedPage = Object.values(disambiguationResult.query!.pages).find(
    (e) =>
      probableArtistNouns.some(
        (noun) =>
          e.title.toLowerCase() === artistName.toLowerCase() ||
          e.title.toLowerCase().endsWith(`(${noun})`),
      ),
  );

  if (!narrowedPage) {
    console.log("failed to narrow page: " + artistName);
    return;
  }
  console.log("narrowed page to " + narrowedPage.title);

  return await wikipediaRestKy(`/page/summary/${narrowedPage.title}`).json();
}

// const x = await getArtistDescriptionByName("lucy bedroque");

// console.log(x);
