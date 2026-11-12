import { platforms } from "../lib/platform-links.ts";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";

const sites = Object.values(platforms).flatMap((platform) =>
  "domain" in platform ? [platform.domain] : [],
);

for (const site of sites) {
  try {
    const response = await fetch(`https://echoscrape.tijn.dev/favicon/${site}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    if (!response.body) throw new Error("Response body is empty");

    const fileExt = response.url.split(".").at(-1);

    const destination = path.join(cwd(), "./public", site.replaceAll(".", "-") + "." + fileExt);

    await pipeline(
      Readable.fromWeb(response.body as ReadableStream),
      createWriteStream(destination),
    );
  } catch (err) {
    console.log({ site, err });
    continue;
  }
}
