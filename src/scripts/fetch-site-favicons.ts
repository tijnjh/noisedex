import { platforms } from "../lib/platform-links.ts";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream } from "node:stream/web";

for (const { domain } of Object.values(platforms)) {
  const response = await fetch(`https://echoscrape.tijn.dev/favicon/${domain}`);
  if (!response.ok) throw new Error(`${domain}: HTTP ${response.status}`);

  const fileExt = response.url.split(".").at(-1);
  const destination = path.join(cwd(), "./public", `${domain.replaceAll(".", "-")}.${fileExt}`);

  await pipeline(Readable.fromWeb(response.body as ReadableStream), createWriteStream(destination));
}
