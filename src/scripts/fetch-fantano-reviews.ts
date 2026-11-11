import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { cwd } from "node:process";

async function swipeKey() {
  try {
    const url = "https://theneedledrop.com/";
    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);

    const key = $("[data-key]").attr("data-key");
    if (!key) throw 0;
    return key;
  } catch {
    throw new Error("couldn't find key");
  }
}

async function fetchReviews() {
  const key = await swipeKey();

  const url = `https://theneedledrop.com/ghost/api/content/search-index/posts/?key=${key}`;
  const res = await fetch(url).then((r) => r.json());

  await writeFile(
    path.join(cwd(), "src", "data", "fantano-reviews.json"),
    JSON.stringify(res.posts, null, 2),
  );
}

void fetchReviews();
