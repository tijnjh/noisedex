import { siteUrl } from "#lib/constants";

// google reads at most 50,000 urls per sitemap
export const sitemapUrlLimit = 50_000;

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function xmlResponse(root: "urlset" | "sitemapindex", item: "url" | "sitemap", paths: string[]) {
  const entries = paths.map((path) => `<${item}><loc>${escapeXml(siteUrl + path)}</loc></${item}>`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</${root}>`;

  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

export const urlsetResponse = (paths: string[]) => xmlResponse("urlset", "url", paths);

export const sitemapIndexResponse = (paths: string[]) =>
  xmlResponse("sitemapindex", "sitemap", paths);

export const artistSitemapPath = (page: number) => `/sitemaps/artists-${page}.xml`;

export const artistSitemapCount = (artistCount: number) => Math.ceil(artistCount / sitemapUrlLimit);
