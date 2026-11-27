// the production server: `node .output/server/index.mjs`
import { AppRoutes } from "#server/routes";
import { HtmlServer } from "@effect/ui/html";
import { HttpRouter } from "effect/http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const template = await readFile(join(publicDir, "index.html"), "utf8");

const { handler } = HttpRouter.toWebHandler(
  AppRoutes((rendered) => HtmlServer.document(template, rendered)),
  { disableLogger: true },
);

const mimeTypes: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

// a file from the client build, but never the page template
async function serveFile(pathname: string, response: ServerResponse) {
  if (pathname === "/" || pathname.endsWith(".html")) return false;

  const file = normalize(join(publicDir, decodeURIComponent(pathname)));
  if (!file.startsWith(publicDir)) return false;

  const info = await stat(file).catch(() => undefined);
  if (!info?.isFile()) return false;

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(file)] ?? "application/octet-stream",
    "Content-Length": info.size,
    // hashed by the build, so they never change
    "Cache-Control": pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
  });
  createReadStream(file).pipe(response);
  return true;
}

function toRequest(request: IncomingMessage, url: URL) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    for (const item of [value ?? []].flat()) headers.append(name, item);
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(url, {
    method: request.method ?? "GET",
    headers,
    ...(hasBody && { body: Readable.toWeb(request) as ReadableStream, duplex: "half" }),
  });
}

const host = process.env.CANONICAL_HOST || "noisedex.com";
const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.host !== host) {
      response.writeHead(307, {
        Location: `https://${host}${url.pathname}${url.search}`,
        "Cache-Control": "no-store",
      });
      return response.end();
    }

    if (request.method === "GET" && (await serveFile(url.pathname, response))) return;

    const answer = await handler(toRequest(request, url));
    response.writeHead(answer.status, Object.fromEntries(answer.headers));
    if (answer.body) Readable.fromWeb(answer.body as never).pipe(response);
    else response.end();
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500);
    response.end();
  }
}).listen(port, () => console.log(`listening on http://localhost:${port}`));
